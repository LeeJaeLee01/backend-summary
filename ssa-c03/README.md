# ssa-c03 — SAA-C03 Question Bank (Express + MongoDB)

Pipeline import PDF: **đọc từng câu → transform schema → lưu MongoDB**.

---

## Schema document trong MongoDB

```json
{
  "number": 1,
  "source": "topic-1/exam-a",
  "title": "Amazon S3 storage",
  "question": {
    "en": "A company collects data for temperature...",
    "vi": ""
  },
  "options": [
    {
      "key": "A",
      "text": { "en": "Turn on S3 Transfer Acceleration...", "vi": "" },
      "explanation": ""
    }
  ],
  "correctAnswers": [],
  "summaryNote": "",
  "questionType": "single",
  "importStatus": "no_answer"
}
```

- PDF chỉ có **EN** → `vi`, `explanation`, `summaryNote`, `correctAnswers` để trống sau import
- **`npm run enrich:markdown`** — điền q1–36 từ `saa-c03-tours` (miễn phí, có đáp án + giải thích)
- **`npm run enrich:ai`** — AI điền các câu còn lại (cần `OPENAI_API_KEY` trong `.env`)

---

## Cài đặt

```bash
cd ssa-c03
cp .env.example .env
npm install
docker compose up -d mongodb
npm run db:reset    # xóa collection cũ + tạo lại schema mới
```

---

## Import (read → transform → save)

### Xem schema câu #1 (không ghi DB)

```bash
npm run import -- --preview 1
```

### Import 1 câu

```bash
npm run import -- --one
npm run import -- --one    # câu tiếp theo (resume)
```

### Import batch / toàn bộ

```bash
npm run import -- --all              # 684 câu
npm run import -- --reset --all      # xóa + import lại
npm run import:status
```

---

## Điền đáp án (PDF không có answer key)

### Cách 1 — Markdown verified (q1–36, miễn phí)

```bash
npm run enrich:markdown
npm run enrich:status
```

### Cách 2 — AI (các câu còn lại, cần API key)

Thêm vào `.env`:

```
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
```

Chạy thử 5 câu:

```bash
npm run enrich:ai -- --limit 5
npm run enrich:ai -- --number 37
npm run enrich:ai -- --all --limit 10   # ~648 câu, tốn token
```

AI sẽ cập nhật: `correctAnswers`, `summaryNote`, `question.vi`, `options[].text.vi`, `options[].explanation`.

**Lưu ý:** AI ~90–95% đúng — nên review câu quan trọng trước khi production.

---

## Backup / Restore DB (mang sang máy khác)

File backup hiện tại: `backup/ssa_c03-latest.archive.gz` (~235KB, 684 câu, 86 câu đã có đáp án).

### Tạo backup mới (sau khi enrich thêm)

```bash
npm run db:backup
# → backup/ssa_c03-YYYYMMDD-HHMM.archive.gz
```

### Restore trên máy khác

```bash
cd ssa-c03
cp .env.example .env
npm install
docker compose up -d mongodb

# Copy file backup vào thư mục backup/
npm run db:restore -- backup/ssa_c03-latest.archive.gz

npm run enrich:status
npm run dev
```

Hoặc restore thủ công (không cần script):

```bash
docker cp backup/ssa_c03-latest.archive.gz ssa-c03-mongo:/tmp/restore.archive.gz
docker exec ssa-c03-mongo mongorestore --drop --gzip --archive=/tmp/restore.archive.gz
```

---

## Chạy API

```bash
yarn start
# http://localhost:3030
```

| Method | Path |
|--------|------|
| GET | `/import/preview/1` |
| POST | `/import/one` |
| POST | `/import/batch` |
| POST | `/import/run-all` |
| GET | `/questions` |
| GET | `/questions/1?include=state,note` |
| GET | `/me` |
| PATCH | `/me/preferences` |
| GET/PUT | `/notes/:number` |
| GET/PATCH | `/progress/:number` |
| POST | `/sessions` |
| GET | `/sessions/:id` |
| PATCH | `/sessions/:id/answer` |
| POST | `/sessions/:id/reveal` |
| POST | `/sessions/:id/finish` |

---

## Frontend (CRA + yarn)

```bash
# Terminal 1 — API
cd ssa-c03
yarn start
# http://localhost:3030

# Terminal 2 — FE
cd ssa-c03/web
yarn start
# http://localhost:3001  → API http://localhost:3030
```

Tính năng: Practice / Study / Exam, song ngữ EN nổi + VI phụ, notes autosave, bookmark/flag, filters, stats.

Điền giải thích đúng/sai cho mọi option:

```bash
yarn explain:fill-all
yarn explain:status
yarn db:backup
```

Spec: `docs/superpowers/specs/2026-07-23-ssa-c03-web-design.md`

---

## Env

| Biến | Mặc định |
|------|----------|
| `SOURCE_FILE` | `../AWS Certified Solutions Architect Associate SAA-C03.pdf` |
| `DEFAULT_SOURCE` | `topic-1/exam-a` |
| `IMPORT_BATCH_SIZE` | `25` |
| `MONGODB_URI` | `mongodb://localhost:27017/ssa_c03` |

---

## Cấu trúc code

```
src/services/
  questionIterator.js    # đọc từng block từ PDF
  questionParser.js      # parse raw block
  questionTransformer.js # raw → schema MongoDB
  importService.js       # processAndSaveOne() pipeline
```
