# Multi-Agent Project Guide

Tai lieu nay giai thich du an multi-agent o muc thuc chien, danh cho truong hop chua tung lam dang bai nay.

## 1. Multi-agent la gi trong du an nay

Hay bo qua cach hieu "AI rat phuc tap". O muc xay dung he thong, multi-agent thuong chi la:

- Tach 1 bai toan lon thanh nhieu buoc nho
- Moi buoc co 1 agent hoac 1 service chuyen trach
- Cac buoc noi voi nhau bang state
- Co 1 supervisor dieu phoi thu tu va xu ly loi

Voi de tai cua ban:

- `CV Analysis Agent`: doc CV thanh du lieu co cau truc
- `Skill Gap Agent`: so khop voi JD va tim skill gap
- `Career Advisor Agent`: sinh goi y hoc tap
- `Supervisor`: dieu phoi va dung lai o diem can HR phe duyet

## 2. Quy trinh lam du an nen di nhu nao

Khong nen lao vao code agent ngay. Thu tu an toan hon la:

1. Chot use case dau tien
2. Ve workflow end-to-end
3. Chot input/output cua tung agent
4. Chot data model va database
5. Moi bat dau code phien ban mock
6. Sau do moi thay mock bang LLM, OCR, vector DB

## 3. Ban nen chia phase nhu sau

### Phase 1: Mock de hieu he thong

Muc tieu:

- Chua can AI that
- Chi can thay duoc workflow
- Agent co the dung rule-based hardcode

Output:

- Chay duoc demo tu CV text -> match -> learning path

### Phase 2: Co backend that

Muc tieu:

- Dung `FastAPI`
- Tao API upload CV
- Luu candidate, job, result vao database

Output:

- Co endpoint de front-end goi

### Phase 3: Them AI that

Muc tieu:

- PDF parser hoac vision OCR
- LLM structured outputs cho CV extraction
- Embedding + pgvector cho matching

Output:

- He thong da co AI dung nghia

### Phase 4: Human-in-the-loop

Muc tieu:

- Co man hinh HR review
- Dung workflow sau khi HR bam approve

Output:

- Dung voi bai toan doanh nghiep va dung voi docs goc

## 4. Skeleton du an that thuong trong nhu sau

```text
app/
  api/
  agents/
  workflows/
  services/
  repositories/
  models/
  schemas/
  prompts/
tests/
docs/
```

## 5. Ban can nho dieu nay

Neu ban chua co kinh nghiem, dung co gang lam "AI xịn" ngay tu dau.
Lam dung thu tu:

- Chay duoc mock
- Chot flow
- Chot data
- Roi moi thay tung thanh phan bang cong nghe that

Trong workspace da co them thu muc `demo_multi_agent/` de ban nhin mot vi du cuc nho nhung dung tu duy du an multi-agent.
