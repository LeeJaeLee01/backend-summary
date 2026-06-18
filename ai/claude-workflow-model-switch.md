# Claude workflow — Chuyển model thực tế trong Cursor

> Playbook áp dụng khi bạn chạy pipeline `start-feature → execute → complete` (xem [ai-index.md](./ai-index.md)) bằng **Claude / Cursor Agent**. Mục tiêu: **cùng một feature, nhiều model khác nhau** — không trả giá Opus cho việc viết Jira comment.

Liên quan: [model-routing-cost.md](./model-routing-cost.md)

---

## 1. Setup một lần (5 phút)

### Bước 1 — Đặt default model rẻ cho Agent

1. Mở **Cursor Settings** → **Models**
2. **Default model cho Agent/Chat**: chọn **Composer Fast** hoặc **Claude Sonnet** (balanced) — **không** để Opus / Thinking làm default
3. Tắt **Auto** nếu bạn muốn tự kiểm soát từng message (tránh Cursor tự chọn model đắt)

### Bước 2 — Tắt Max mode mặc định

- Chỉ bật **Max** khi thật sự cần context cực lớn (refactor cả monorepo)
- Max + Opus = tốn nhất; hầu hết task chỉ cần context `@file` vài file

### Bước 3 — Dùng rule đã có trong repo

File `.cursor/rules/model-routing.mdc` nhắc agent gợi ý tier model phù hợp mỗi khi bạn bắt đầu phase mới.

---

## 2. Cách chuyển model (thao tác hàng ngày)

### Trong Cursor Chat / Agent

```
1. Click dropdown model (góc dưới ô chat)
2. Chọn model cho message TIẾP THEO
3. Gửi prompt — context chat giữ nguyên, chỉ model đổi
```

| Chế độ | Khi dùng | Model gợi ý |
|--------|----------|-------------|
| **Ask** (chỉ đọc) | Review, giải thích, đọc spec | Fast / Sonnet |
| **Agent** (sửa file) | Implement, chạy lệnh | Sonnet; Opus khi kẹt |
| **Chat mới** | Bắt đầu phase mới, bỏ context cũ | Bất kỳ — dùng khi chuyển Heavy → Fast |

### Mẹo tiết kiệm context ( = tiền)

| Làm | Không làm |
|-----|-----------|
| Chat mới cho phase **execute** sau khi spec đã commit | Kéo cả buổi brainstorm 50 message vào lúc sửa lint |
| `@ai/ai-index.md` + `@docs/superpowers/plans/xxx.md` | `@codebase` cho task 1 file |
| Copy **5 dòng quyết định** từ spec sang chat execute | Paste nguyên design doc 20 trang |

---

## 3. Map model theo từng phase workflow

Áp dụng trực tiếp cho pipeline trong [ai-index.md](./ai-index.md):

```
┌─────────────────┬──────────────┬────────────────────────────────────┐
│ Phase           │ Model        │ Hành động bạn                      │
├─────────────────┼──────────────┼────────────────────────────────────┤
│ start-feature   │ Opus/Thinking│ Chat MỚI — brainstorm + spec       │
│ writing-plans   │ Sonnet       │ CÙNG chat hoặc chat mới + @spec    │
│ execute tasks   │ Sonnet/Fast  │ Chat MỚI — chỉ @plan + file task    │
│ debug kẹt       │ Opus/Thinking│ Escalate 1 message, không cả phase │
│ complete-feature│ Fast         │ Chat MỚI — @feature-state + diff    │
└─────────────────┴──────────────┴────────────────────────────────────┘
```

---

## 4. Prompt mẫu — copy/paste khi chuyển phase

### Phase A — `start-feature` (Model: **Opus** hoặc **Sonnet Thinking**)

```text
Start feature AOL-XXX.
Dùng skill start-feature trong ai-index.
Chỉ làm: đọc Jira → draft PR → brainstorm spec → plan outline.
CHƯA implement code.
Output: spec ngắn + list file sẽ đụng.
```

### Chuyển model → **Sonnet** (viết plan chi tiết)

```text
Đổi sang Sonnet. Viết implementation plan theo spec @docs/superpowers/specs/...
Gắn nhãn [parallel] hoặc [sequential] cho từng batch.
Không viết code.
```

### Chuyển model + **chat mới** → **Sonnet** hoặc **Composer Fast** (execute)

```text
Execute batch 1 trong plan @docs/superpowers/plans/...
Chỉ task 1.1–1.3. Tuân [sequential].
Tạo Jira sub-task, implement, chạy test.
```

### Escalate → **Opus** (chỉ khi test fail 2 lần)

```text
[ESCALATE] Test X fail sau 2 lần sửa.
Log: ...
Chỉ tìm root cause, đề xuất fix 1 hướng — chưa sửa file.
```

### Downgrade → **Composer Fast** (complete)

```text
Complete feature theo ai-index.
Đọc @.claude/feature-state.json
Viết PR comment + Jira comment ngắn. Không refactor thêm.
```

---

## 5. Ví dụ 1 feature thật (tiết kiệm ~60% token)

**Feature:** thêm rate limit cho API export

| Bước | Model | Thời gian | Việc làm |
|------|-------|-----------|----------|
| 1 | Opus | 15 phút | Trade-off: Redis vs in-memory vs middleware — chốt spec 1 trang |
| 2 | Sonnet | 10 phút | Plan 4 task, commit plan |
| 3 | **Chat mới** + Sonnet | 45 phút | Implement 4 task theo plan |
| 4 | Fast | 5 phút | PR description, checklist |

**Không làm:** chạy cả 4 bước trên Opus trong 1 chat dài → tốn 3–5× token.

---

## 6. Khi nào mở chat mới vs giữ chat cũ

| Giữ chat cũ | Mở chat mới |
|-------------|-------------|
| Plan ngay sau spec (cùng ngữ cảnh) | Execute sau khi spec/plan đã commit |
| Debug liên tiếp cùng bug | Complete sau khi code xong |
| Escalate 1 câu hỏi RCA | Task trivial sau buổi design dài |

**Quy tắc ngón tay cái:** phase mới + artifact đã lưu file → **chat mới + model rẻ hơn**.

---

## 7. Claude Code CLI (nếu dùng terminal)

Ngoài Cursor UI, Claude Code hỗ trợ đổi model trong session:

```bash
# Xem model hiện tại
/model

# Chuyển sang Sonnet (rẻ hơn Opus)
/model sonnet

# Chuyển Opus cho design
/model opus
```

Workflow gợi ý:

```bash
# Terminal 1 — design (Opus)
claude
/model opus
> brainstorm feature X ...

# Terminal 2 — implement (Sonnet) — session mới, ít history
claude
/model sonnet
> implement theo plan trong docs/superpowers/plans/...
```

---

## 8. Checklist trước mỗi lần gửi prompt

- [ ] Phase này cần **suy luận** hay chỉ **làm theo plan**?
- [ ] Đã **commit spec/plan** chưa → nếu rồi, hạ model + chat mới?
- [ ] Prompt có **`@file` cụ thể** thay vì whole repo?
- [ ] Agent có đang **Max mode** không cần thiết?
- [ ] Task trivial → đã thử **Fast** chưa?

---

## 9. Tóm tắt

| Việc | Model |
|------|-------|
| Design / brainstorm / kiến trúc | Opus, Sonnet Thinking |
| Implement theo plan | Sonnet, Composer Fast |
| Lint, comment, PR text | Composer Fast |
| Debug khó (sau 2 fail) | Opus — **1 shot**, không cả session |

**Chuyển model = đổi dropdown + (thường) chat mới khi sang phase execute/complete.**
