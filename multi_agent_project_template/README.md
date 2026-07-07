# Multi-Agent Project Template

Thu muc nay la bo khung de bat dau mot du an multi-agent nghiem tuc, theo huong co the mo rong thanh san pham that.

## Muc tieu cua cau truc nay

Cau truc duoc chia theo trach nhiem:

- `app/`: code ung dung chinh
- `tests/`: test
- `docs/`: tai lieu thiet ke, quyet dinh, diagram
- `scripts/`: script chay local, seed, migration helper
- `infra/`: ha tang local/deploy

## Tong quan cau truc

```text
multi_agent_project_template/
  README.md
  .env.example
  app/
    api/
    agents/
    workflows/
    services/
    repositories/
    models/
    schemas/
    prompts/
    core/
    db/
  tests/
    unit/
    integration/
  docs/
    architecture/
    decisions/
    api/
  scripts/
  infra/
    docker/
    postgres/
```

## Y nghia tung thu muc

### `app/api/`

Noi dat API route, controller, dependency injection cho web backend.

Vi du:

- upload CV
- tao Job Description
- chay workflow danh gia
- HR approve ket qua

### `app/agents/`

Noi dat logic cua tung agent.

Vi du:

- `cv_analysis_agent.py`
- `skill_gap_agent.py`
- `career_advisor_agent.py`
- `supervisor_agent.py`

Moi agent nen co input/output ro rang, khong nen truy cap lung tung qua nhieu module.

### `app/workflows/`

Noi dat workflow dieu phoi giua cac agent.

Neu dung `LangGraph`, day thuong la noi tao graph, state machine, node, edge, pause state.

### `app/services/`

Noi dat service dung chung, khong phai agent.

Vi du:

- OCR service
- LLM client service
- embedding service
- scoring service
- file storage service

### `app/repositories/`

Noi dat lop truy cap database.

Muc dich la tach phan query khoi agent va workflow.

### `app/models/`

Noi dat database models.

Neu dung SQLAlchemy, day la noi dinh nghia bang `Candidate`, `Job`, `Assessment`, `LearningPath`.

### `app/schemas/`

Noi dat schema request/response va schema state.

Vi du:

- API request schema
- API response schema
- workflow state schema
- structured output schema cho LLM

### `app/prompts/`

Noi dat prompt template cho LLM.

Nen tach rieng de sau nay de sua prompt ma khong lam roi workflow.

### `app/core/`

Noi dat config va cac thanh phan cross-cutting.

Vi du:

- settings
- logging
- constants
- security helper

### `app/db/`

Noi dat ket noi DB, session, migration config.

### `tests/unit/`

Test tung agent, scoring function, parser.

### `tests/integration/`

Test end-to-end workflow, API, DB.

### `docs/architecture/`

Noi de architecture diagram, workflow diagram, sequence diagram.

### `docs/decisions/`

Noi luu cac quyet dinh ky thuat quan trong.

Vi du:

- tai sao chon GPT hay Gemini
- tai sao full state hay reference state
- tai sao OCR local hay vision model

### `docs/api/`

Noi mo ta API contract cho frontend va backend.

### `scripts/`

Noi dat script chay local.

Vi du:

- seed du lieu mau
- import CV mau
- chay demo workflow

### `infra/docker/`

Noi dat `Dockerfile`, `docker-compose.yml`, service local.

### `infra/postgres/`

Noi dat init SQL, extension `pgvector`, script setup.

## Thu tu code dung

Neu ban moi lam du an nay, nen di theo thu tu:

1. Dinh nghia `schemas/` va `models/`
2. Viet `agents/` o dang mock
3. Noi bang `workflows/`
4. Tao `api/` de goi workflow
5. Sau do moi them OCR, LLM, vector DB that vao `services/`

## Cach nghi dung

Hay xem cau truc nay nhu mot khung xuong:

- `agents/` la noi chua tri tue xu ly theo tung vai tro
- `workflows/` la noi quyet dinh agent nao chay truoc chay sau
- `services/` la noi noi ra cong cu ben ngoai
- `repositories/` la noi lam viec voi database
- `api/` la cua vao cua he thong

Ban co the copy cau truc nay lam nen cho do an, roi dien code dan vao tung thu muc.
