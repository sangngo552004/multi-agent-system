# Demo Multi-Agent Recruiter

Day la bo khung toi gian de ban thay mot du an multi-agent thuong duoc to chuc nhu the nao.

## Muc tieu

Demo nay mo phong bai toan tuyen dung trong docs:

1. Doc CV
2. So khop voi Job Description
3. Tim skill gap
4. Sinh learning path

Khong goi LLM that. Moi agent duoc viet theo kieu "co the thay bang LLM sau nay".

## Cau truc thu muc

- `main.py`: diem chay demo
- `schemas.py`: dinh nghia state va data model
- `agents.py`: cac agent chuyen trach
- `workflow.py`: supervisor dieu phoi luong

## Cach hieu du an multi-agent

Trong du an that, "multi-agent" khong co nghia la nhieu AI phuc tap ngay lap tuc.
Thuong no la:

- Moi agent phu trach 1 nhiem vu ro rang
- Co state dung chung de truyen ket qua
- Co supervisor hoac workflow dieu phoi thu tu chay
- Co diem dung de con nguoi phe duyet neu can

## Chay thu

```bash
python main.py
```

## Khi nao nang cap len du an that

Sau khi ban hieu demo nay, co the nang cap theo 4 buoc:

1. Thay input CV mock bang file PDF/docx that
2. Thay rule-based parser bang OCR + LLM structured outputs
3. Thay matching don gian bang embedding + vector database
4. Them API + database + giao dien cho HR
