"""RabbitMQ consumer for async CV extraction.

Listens to the cv.extract.request queue for CV extraction messages
from the Java backend. Processes each CV through the pipeline and
publishes results back to the callback queue.
"""

import asyncio
import json
import logging
import threading
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

import pika
from pika.exceptions import AMQPConnectionError

from app.agents.extractor_agent import agent as cv_pipeline
from app.core.config import settings
from app.core.schemas import (
    ApplicationProcessRequest,
    CVExtractRequest,
    CVExtractResult,
    ExtractionStatus,
)

logger = logging.getLogger(__name__)

# Flag to stop the consumer gracefully
_should_stop = False


def start_consumer_thread() -> threading.Thread:
    """Start the RabbitMQ consumer in a background thread.

    Returns:
        The consumer thread instance.
    """
    thread = threading.Thread(
        target=_run_consumer,
        name="rabbitmq-consumer",
        daemon=True,
    )
    thread.start()
    return thread


def _run_consumer():
    """Main consumer loop with reconnection logic."""
    global _should_stop

    while not _should_stop:
        try:
            logger.info(
                "Connecting to RabbitMQ at %s...",
                settings.RABBITMQ_URL,
            )
            # Set heartbeat to 600s (10 minutes) to prevent connection drops during long AI processing
            url = settings.RABBITMQ_URL
            if "heartbeat=" not in url:
                url += "&heartbeat=600" if "?" in url else "?heartbeat=600"

            connection = pika.BlockingConnection(pika.URLParameters(url))
            channel = connection.channel()

            # Declare queues (idempotent)
            channel.queue_declare(
                queue=settings.CV_EXTRACT_QUEUE,
                durable=True,
            )
            channel.queue_declare(
                queue=settings.CV_RESULT_QUEUE,
                durable=True,
            )
            channel.queue_declare(
                queue=settings.APPLICATION_PROCESS_QUEUE,
                durable=True,
            )
            channel.queue_declare(
                queue=settings.APPLICATION_EVENT_QUEUE,
                durable=True,
            )

            # Prefetch 1 message at a time (important for heavy processing)
            channel.basic_qos(prefetch_count=1)

            # Register callback
            channel.basic_consume(
                queue=settings.CV_EXTRACT_QUEUE,
                on_message_callback=_on_message,
            )
            channel.basic_consume(
                queue=settings.APPLICATION_PROCESS_QUEUE,
                on_message_callback=_on_application_message,
            )

            logger.info(
            "RabbitMQ consumer started. Listening on queues: %s, %s",
            settings.CV_EXTRACT_QUEUE,
            settings.APPLICATION_PROCESS_QUEUE,
            )
            channel.start_consuming()

        except AMQPConnectionError as e:
            logger.error("RabbitMQ connection failed: %s. Retrying in 5s...", e)
            import time

            time.sleep(5)
        except Exception as e:
            logger.error("RabbitMQ consumer error: %s. Retrying in 5s...", e)
            import time

            time.sleep(5)


def _on_message(channel, method, properties, body):
    """Handle incoming RabbitMQ message."""
    try:
        # Parse message
        message_data = json.loads(body)
        request = CVExtractRequest(**message_data)

        logger.info(
            "Received CV extraction request: application_id=%s",
            request.application_id,
        )

        # Download file from URL
        file_content = _download_file(request.file_url)
        if file_content is None:
            _publish_error(
                channel,
                request,
                "Failed to download file from URL",
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        # Run extraction pipeline
        filename = request.file_url.split("/")[-1]

        # Run async pipeline in a new event loop
        loop = asyncio.new_event_loop()
        try:
            result = loop.run_until_complete(
                cv_pipeline.process_cv(file_content, filename)
            )
        finally:
            loop.close()

        # Publish result
        response = CVExtractResult(
            application_id=request.application_id,
            result=result,
        )

        callback_queue = request.callback_queue or settings.CV_RESULT_QUEUE

        channel.basic_publish(
            exchange="",
            routing_key=callback_queue,
            body=response.model_dump_json(),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Persistent
                content_type="application/json",
            ),
        )

        logger.info(
            "Published extraction result for application_id=%s to queue=%s (status=%s)",
            request.application_id,
            callback_queue,
            result.status.value,
        )

        # Ack the message
        channel.basic_ack(delivery_tag=method.delivery_tag)

    except json.JSONDecodeError as e:
        logger.error("Invalid message JSON: %s", e)
        # Nack without requeue (bad message format, won't fix on retry)
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.error("Error processing message: %s", e, exc_info=True)
        # Nack with requeue (transient error, might succeed on retry)
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def _on_application_message(channel, method, properties, body):
    """Process a versioned application command and emit progress events."""
    request: ApplicationProcessRequest | None = None
    try:
        request = ApplicationProcessRequest(**json.loads(body))
        logger.info(
            "Received application processing request: application_id=%s run_id=%s",
            request.application_id,
            request.run_id,
        )
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(_process_application(channel, request))
        finally:
            loop.close()
        channel.basic_ack(delivery_tag=method.delivery_tag)
    except json.JSONDecodeError as exc:
        logger.error("Invalid application command JSON: %s", exc)
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as exc:
        logger.error("Application processing failed: %s", type(exc).__name__)
        if request is not None:
            _publish_application_event(
                channel,
                request,
                "RUN_FAILED",
                step="EXTRACTION",
                message="The AI processing pipeline failed.",
                errorCode="AI_PROCESSING_FAILED",
                errorMessage="The AI processing pipeline failed.",
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
        else:
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


async def _process_application(channel, request: ApplicationProcessRequest):
    """Run Extract -> Match -> optional Career Path with persisted progress."""
    from app.agents.orchestrator import (
        async_extract_node,
        career_path_node,
        match_node,
    )

    file_content = _download_file(request.file_url)
    if file_content is None:
        _publish_application_event(
            channel,
            request,
            "RUN_FAILED",
            step="EXTRACTION",
            message="The CV file could not be downloaded.",
            errorCode="FILE_UNAVAILABLE",
            errorMessage="The CV file could not be downloaded.",
        )
        return

    state = {
        "application_id": request.application_id,
        "file_content": file_content,
        "filename": request.file_url.split("/")[-1] or "resume",
        "job_data": request.job_snapshot,
        "hr_preferences": "",
        "cv_data": None,
        "match_result": None,
        "career_path_result": None,
        "needs_human_review": False,
        "telemetry": {},
    }

    _publish_application_event(
        channel,
        request,
        "STEP_STARTED",
        step="EXTRACTION",
        message="Extracting structured CV data.",
    )
    extraction_update = await async_extract_node(state)
    state.update(extraction_update)
    cv_data = state["cv_data"]
    extraction_metrics = {
        "aiConfidence": cv_data.confidence_scores.overall,
        "warningCount": len(cv_data.warnings),
        "extractionMethod": cv_data.extraction_method.value.upper(),
        "needsReview": cv_data.status != ExtractionStatus.SUCCESS,
    }
    if cv_data.status == ExtractionStatus.FAILED:
        _publish_application_event(
            channel,
            request,
            "RUN_FAILED",
            step="EXTRACTION",
            message="The CV file is invalid or unreadable.",
            errorCode="INVALID_FILE",
            errorMessage="The CV file is invalid or unreadable.",
            **extraction_metrics,
        )
        return
    _publish_application_event(
        channel,
        request,
        "STEP_COMPLETED",
        step="EXTRACTION",
        message="CV extraction completed.",
        **extraction_metrics,
    )

    _publish_application_event(
        channel,
        request,
        "STEP_STARTED",
        step="MATCHING",
        message="Matching the CV against the job snapshot.",
    )
    matching_update = await match_node(state)
    state.update(matching_update)
    match_result = state["match_result"]
    _publish_application_event(
        channel,
        request,
        "STEP_COMPLETED",
        step="MATCHING",
        message="Job matching completed.",
        matchScore=match_result.overall_score,
        needsReview=state["needs_human_review"],
    )

    should_build_career_path = (
        settings.CAREER_PATH_ENABLED and not state["needs_human_review"]
    )
    if should_build_career_path:
        _publish_application_event(
            channel,
            request,
            "STEP_STARTED",
            step="CAREER_PATH",
            message="Generating a career path.",
        )
        career_update = await career_path_node(state)
        state.update(career_update)
        _publish_application_event(
            channel,
            request,
            "STEP_COMPLETED",
            step="CAREER_PATH",
            message="Career path generation completed.",
        )
    else:
        _publish_application_event(
            channel,
            request,
            "STEP_SKIPPED",
            step="CAREER_PATH",
            message="Career path generation was not required.",
        )

    final_metrics = {
        **extraction_metrics,
        "matchScore": match_result.overall_score,
        "needsReview": state["needs_human_review"],
    }
    _publish_application_event(
        channel,
        request,
        "RUN_COMPLETED",
        message="AI processing completed.",
        **final_metrics,
    )


def _publish_application_event(
    channel,
    request: ApplicationProcessRequest,
    event_type: str,
    **fields,
):
    payload = {
        "schemaVersion": "1.0",
        "eventId": str(uuid4()),
        "applicationId": request.application_id,
        "runId": request.run_id,
        "type": event_type,
        "occurredAt": datetime.now(timezone.utc).isoformat(),
        **fields,
    }
    channel.basic_publish(
        exchange="",
        routing_key=request.callback_queue or settings.APPLICATION_EVENT_QUEUE,
        body=json.dumps(payload),
        properties=pika.BasicProperties(
            delivery_mode=2,
            content_type="application/json",
        ),
    )


def _download_file(url: str) -> Optional[bytes]:
    """Download a file from URL."""
    try:
        import httpx

        with httpx.Client(timeout=30) as client:
            response = client.get(url)
            response.raise_for_status()
            return response.content
    except Exception as e:
        logger.error("Failed to download file from %s: %s", url, e)
        return None


def _publish_error(
    channel,
    request: CVExtractRequest,
    error_msg: str,
):
    """Publish an error response back to the callback queue."""
    from app.core.schemas import CVExtractionResponse

    response = CVExtractResult(
        application_id=request.application_id,
        result=CVExtractionResponse(warnings=[error_msg]),
        error=error_msg,
    )

    callback_queue = request.callback_queue or settings.CV_RESULT_QUEUE

    channel.basic_publish(
        exchange="",
        routing_key=callback_queue,
        body=response.model_dump_json(),
        properties=pika.BasicProperties(
            delivery_mode=2,
            content_type="application/json",
        ),
    )
