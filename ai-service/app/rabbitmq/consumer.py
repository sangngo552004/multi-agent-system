"""RabbitMQ consumer for async CV extraction.

Listens to the cv.extract.request queue for CV extraction messages
from the Java backend. Processes each CV through the pipeline and
publishes results back to the callback queue.
"""

import asyncio
import json
import logging
import threading
from typing import Optional

import pika
from pika.exceptions import AMQPConnectionError

from app.agents.extractor_agent import agent as cv_pipeline
from app.core.config import settings
from app.core.schemas import CVExtractRequest, CVExtractResult

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
            connection = pika.BlockingConnection(
                pika.URLParameters(settings.RABBITMQ_URL)
            )
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

            # Prefetch 1 message at a time (important for heavy processing)
            channel.basic_qos(prefetch_count=1)

            # Register callback
            channel.basic_consume(
                queue=settings.CV_EXTRACT_QUEUE,
                on_message_callback=_on_message,
            )

            logger.info(
                "RabbitMQ consumer started. Listening on queue: %s",
                settings.CV_EXTRACT_QUEUE,
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
            "Received CV extraction request: application_id=%s, file_url=%s",
            request.application_id,
            request.file_url,
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
