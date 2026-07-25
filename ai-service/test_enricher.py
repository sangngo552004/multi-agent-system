"""Quick test for the LLM enricher - Experience & Projects extraction."""
import asyncio
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SAMPLE_CV = """
John Doe
Email: john.doe@email.com | Phone: 0901234567 | Location: Ho Chi Minh City, Vietnam

WORK EXPERIENCE
---------------
Senior Backend Engineer
FPT Software | Full-time | Jan 2022 - Present | Ho Chi Minh City
- Designed and developed RESTful APIs for a banking core system serving 500,000+ users
- Led migration from monolithic to microservices architecture using Spring Boot and Kafka
- Implemented CI/CD pipelines with Jenkins and Docker, reducing deployment time by 40%
- Mentored a team of 5 junior developers
- Technologies: Java, Spring Boot, Kafka, PostgreSQL, Docker, Kubernetes, Redis

Software Engineer
VNG Corporation | Full-time | Jun 2019 - Dec 2021 | Ho Chi Minh City
- Built real-time chat features for Zalo (Vietnam top messaging app, 70M users)
- Developed WebSocket gateway handling 100K concurrent connections
- Optimized database queries reducing p99 latency from 200ms to 45ms
- Technologies: Go, gRPC, Redis, MySQL, Nginx

Intern Software Developer
Tiki | Internship | Jan 2019 - May 2019
- Assisted in developing product recommendation engine
- Built data pipeline for user behavior analytics
- Technologies: Python, Spark, Airflow

PROJECTS
--------
E-Commerce Platform (Personal Project)
GitHub: https://github.com/johndoe/ecommerce-platform
Duration: 6 months | Team size: Solo project
A full-stack e-commerce platform with microservices architecture.
- Implemented product catalog, cart, checkout, and payment modules
- Integrated VNPay and MoMo payment gateways
- Achieved 99.9% uptime with auto-scaling on AWS ECS
- Technologies: Node.js, React, MongoDB, Redis, Docker, AWS

Real-time Stock Dashboard
Duration: 3 months | Team: 3 people
A web dashboard for real-time Vietnamese stock market data.
- Built WebSocket-based data streaming from SSI and VPS APIs
- Created interactive charts with D3.js and React
- Deployed on GCP Cloud Run with auto-scaling
- Technologies: Python FastAPI, React, D3.js, WebSocket, GCP
"""

async def main():
    from app.agents.extractor_agent.llm_enricher import enrich_experience_and_projects

    print("Calling Gemini Flash enricher...")
    print("-" * 60)

    exp_list, proj_list = await enrich_experience_and_projects(SAMPLE_CV)

    print(f"\n=== EXPERIENCE ({len(exp_list)} entries) ===\n")
    for i, e in enumerate(exp_list):
        print(f"  [{i+1}] Company       : {e.get('company')}")
        print(f"       Position      : {e.get('position')}")
        print(f"       Employment    : {e.get('employment_type')}")
        print(f"       Period        : {e.get('start_date')} -> {e.get('end_date')}")
        print(f"       Location      : {e.get('location')}")
        print(f"       Domain        : {e.get('business_domain')}")
        summary = e.get("summary") or ""
        print(f"       Summary       : {summary[:160]}{'...' if len(summary)>160 else ''}")
        resps = e.get("responsibilities", [])
        print(f"       Responsibilities ({len(resps)}): {resps[:2]}")
        achvs = e.get("achievements", [])
        print(f"       Achievements ({len(achvs)}): {achvs[:2]}")
        print(f"       Technologies  : {e.get('technologies', [])}")
        print()

    print(f"=== PROJECTS ({len(proj_list)} entries) ===\n")
    for i, p in enumerate(proj_list):
        print(f"  [{i+1}] Name     : {p.get('name')}")
        print(f"       Role     : {p.get('role')}")
        print(f"       Team     : {p.get('team_size')}")
        print(f"       Duration : {p.get('duration')}")
        print(f"       URL      : {p.get('url')}")
        summary = p.get("summary") or ""
        print(f"       Summary  : {summary[:160]}{'...' if len(summary)>160 else ''}")
        print(f"       Tech     : {p.get('technologies', [])}")
        achvs = p.get("achievements", [])
        print(f"       Achievements ({len(achvs)}): {achvs}")
        print()

    print("=== RAW JSON ===")
    print(json.dumps({"experience": exp_list, "projects": proj_list}, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
