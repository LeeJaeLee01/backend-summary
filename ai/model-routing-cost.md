# Chọn model AI theo task — Tiết kiệm chi phí, linh hoạt chuyển model

> Chiến lược **route task → model phù hợp**: task đơn giản dùng model nhanh/rẻ; task phức tạp mới escalate lên model mạnh. Chuyển model giữa các bước trong cùng một phiên là bình thường — không cần “một model cho mọi thứ”.

Liên quan: [ai-index.md](./ai-index.md) — quy trình feature end-to-end trên repo.

**Thực hành Claude + Cursor:** [claude-workflow-model-switch.md](./claude-workflow-model-switch.md) — setup, chuyển model từng phase, prompt copy/paste.

---

## 1. Nguyên tắc cốt lõi

| Nguyên tắc | Giải thích |
|------------|------------|
| **Đúng công cụ, đúng việc** | Model mạnh tốn token + thời gian; dùng cho việc cần suy luận sâu, không dùng cho rename file |
| **Escalate có chủ đích** | Bắt đầu rẻ → chỉ nâng cấp khi output sai, scope mở rộng, hoặc cần trade-off kiến trúc |
| **Context càng dài, càng tốn** | Model mạnh + context lớn = chi phí nhân đôi; tách task, dùng `@file` thay vì dump cả repo |
| **Batch việc nhỏ** | Gom 3–5 thay đổi trivial vào một prompt thay vì 5 phiên riêng |
| **Human gate trước khi tốn tiền** | Spec/plan ngắn do model rẻ viết → bạn duyệt → model mạnh implement |

---

## 2. Phân tầng model (tham chiếu Cursor)

Nhóm theo **mức độ suy luận** và **chi phí ước tính** (cao → thấp):

```
Tier 3 — Heavy reasoning     Opus / Sonnet Thinking / Codex (high)
Tier 2 — Balanced            Sonnet medium / GPT medium / Codex
Tier 1 — Fast & cheap        Composer Fast / model nhẹ, ít thinking
```

| Tier | Model gợi ý (Cursor) | Khi nào dùng | Tránh dùng cho |
|------|----------------------|--------------|----------------|
| **1 — Fast** | Composer 2.5 Fast | Sửa typo, format, thêm comment, rename, boilerplate, đọc 1 file | Debug production, thiết kế hệ thống, refactor cross-module |
| **2 — Balanced** | GPT-5.x medium, Sonnet medium, Codex | Implement feature đã có spec, viết test, CRUD, API handler, SQL thông thường | Brainstorm kiến trúc mới từ zero, RCA bug hiếm |
| **3 — Heavy** | Opus, Sonnet Thinking, Codex (deep) | Thiết kế kiến trúc, trade-off CAP/consistency, debug khó, review security, migration lớn | Comment code, đổi tên biến, gen README 3 dòng |

> Tên model thay đổi theo thời gian — bảng trên là **logic phân tầng**, không phải bảng giá cố định. Luôn đối chiếu pricing trong Cursor Settings.

---

## 3. Bảng routing: Task → Model gợi ý

### 3.1. Theo loại công việc

| Task | Tier | Model gợi ý | Lý do |
|------|------|-------------|-------|
| Đổi tên biến / format / lint fix | 1 | Fast | Pattern rõ, ít rủi ro |
| Viết unit test cho hàm đã có | 1–2 | Fast → Balanced | Fast đủ nếu signature rõ; Balanced nếu mock phức tạp |
| Implement theo plan có sẵn | 2 | Balanced | Spec đã khóa scope — không cần thinking sâu |
| Viết migration SQL / index | 2 | Balanced | Cần đúng syntax + hiểu schema, không cần Opus |
| Code review PR nhỏ (<200 dòng) | 2 | Balanced | Đủ nhận diện smell & bug thường |
| Code review PR lớn / security | 3 | Heavy | Rủi ro cao — đáng trả premium |
| Brainstorm API design | 3 | Heavy | Nhiều trade-off; output sai = rework đắt hơn token |
| Debug “works on my machine” | 3 | Heavy | Cần trace nhiều lớp |
| Viết tài liệu kỹ thuật (design doc) | 2–3 | Balanced trước, Heavy polish | Draft rẻ → refine đoạn quan trọng |
| Tóm tắt log / error stack | 1 | Fast | Extract + classify |
| Refactor 1 package, giữ behavior | 2–3 | Balanced; escalate nếu fail test | |
| Refactor cross-service / monolith → micro | 3 | Heavy | |
| Chạy lệnh shell, git status, grep | 1 | Fast hoặc không dùng AI | Terminal đủ |
| Agent chạy nhiều bước tự động | 2 | Balanced | Agent + Opus = tốn nhanh; reserve Heavy cho bước kẹt |

### 3.2. Theo giai đoạn feature (khớp ai-index)

| Giai đoạn | Tier | Ghi chú |
|-----------|------|---------|
| Kickoff — đọc Jira, tóm tắt yêu cầu | 1 | |
| Brainstorm / design spec | 3 | Đầu tư ở đây tiết kiệm rework implement |
| Viết implementation plan | 2–3 | Plan chi tiết: Balanced đủ; plan ảnh hưởng nhiều service: Heavy |
| Execute từng task trong plan | 2 | Đúng spec → không cần model mạnh mỗi task |
| Debug khi test fail | 2 → 3 | 2 lần fail liên tiếp → escalate |
| Complete — comment PR, Jira | 1 | Template + tóm tắt diff |

---

## 4. Quy tắc escalate / downgrade

### Escalate lên tier cao hơn khi:

- Model hiện tại **sai 2 lần** cùng hướng
- Scope **mở rộng** (1 file → cả module)
- Cần **quyết định kiến trúc** (schema, API contract, saga, consistency)
- Bug liên quan **race, deadlock, distributed transaction**
- **Security / auth / payment** — không tiết kiệm ở đây

### Downgrade xuống tier thấp khi:

- Spec/plan **đã khóa** — chỉ còn “làm theo checklist”
- Task **lặp lại** (task 3, 4, 5 cùng pattern trong plan)
- Chỉ cần **diễn đạt lại** output tier cao (viết comment, format, dịch doc)

### Câu chuyển model mẫu (trong Cursor chat):

```text
[Tier 3 đã xong design]
→ Chuyển Composer Fast: "Implement task 2.1–2.4 theo plan @docs/superpowers/plans/..."

[Tier 2 kẹt test]
→ Chuyển Sonnet Thinking: "Test X fail với log sau. Chỉ debug root cause, chưa sửa."

[Tier 3 fix xong]
→ Chuyển Fast: "Apply fix đã thống nhất, chạy test, viết commit message."
```

---

## 5. Cách chuyển model trong Cursor

| Cách | Mô tả |
|------|--------|
| **Model picker** | Chọn model ở dropdown trước khi gửi prompt tiếp theo — mỗi message có thể khác model |
| **Agent vs Ask** | Ask (đọc/review) → thường Tier 1–2; Agent (sửa nhiều file) → Tier 2, escalate khi kẹt |
| **Subagent / Task** | Parent dùng Balanced dispatch; chỉ spawn Heavy cho subtask “explore architecture” |
| **Rules / Skills** | Rule ngắn: *“Task trivial → suggest Fast model”* — nhắc bản thân, không tự động hóa billing |

**Không cần** chat mới khi đổi model — context giữ nguyên; chỉ đổi picker và nói rõ phạm vi message mới.

---

## 6. Mẫu workflow tiết kiệm chi phí

### Workflow A — Feature nhỏ (1–2 ngày)

```
Fast:    đọc ticket + liệt kê file cần sửa
Heavy:   design 1 trang (nếu cần)
Balanced: implement + test
Fast:    PR description, Jira comment
```

### Workflow B — Feature lớn (theo ai-index)

```
Heavy:   brainstorming → spec
Balanced: writing-plans
Balanced: execute batch [sequential] — từng task
Heavy:   chỉ task “shared-types contract” hoặc “migration”
Fast:    complete-feature — comment, checklist
```

### Workflow C — Debug production

```
Fast:    tóm tắt log, phân loại lỗi
Balanced: đọc code path liên quan
Heavy:   RCA nếu Balanced không tìm ra sau 1 vòng
Balanced: implement fix + test
```

---

## 7. Kỹ thuật giảm token (áp dụng mọi tier)

| Kỹ thuật | Tiết kiệm |
|----------|-----------|
| `@file` / `@folder` thay vì paste cả file | Giảm input token |
| Prompt có **output format** (“chỉ diff”, “bullet 5 dòng”) | Giảm output token |
| Tách “plan” và “execute” thành 2 phiên | Tránh kéo design doc vào mọi lần sửa code |
| `.cursorignore` — loại `node_modules`, build artifacts | Agent không đọc rác |
| Dùng terminal cho grep/test thay nhờ AI đọc | Zero token cho việc máy làm được |
| **Max mode** chỉ bật khi context thật sự cần >200k | Max = đắt |

---

## 8. Checklist trước mỗi prompt

1. Task này **đã có spec/plan** chưa? → Có thì hạ tier.
2. **Số file** ảnh hưởng? → 1 file: Tier 1–2; nhiều service: Tier 2–3.
3. **Hậu quả sai**? → Thấp: Tier 1; production/auth: Tier 3.
4. Đã thử **tier thấp** chưa? → Chưa thì không nhảy thẳng Opus.
5. Có thể **gom** với task tiếp theo không?

---

## 9. Ví dụ nhanh (backend Go)

| Yêu cầu | Model |
|---------|-------|
| “Thêm index cho query trong `when-to-index.md` demo” | Fast |
| “Implement worker pool theo `scenario-queue-backpressure.md`” | Balanced |
| “Thiết kế saga compensation cho order + payment” | Heavy |
| “Giải thích đoạn defer trong goroutine” | Fast |
| “Review PR đổi JWT middleware” | Heavy |

---

## 10. Tóm tắt một câu

**Dùng model nhanh cho việc rõ ràng; model mạnh cho quyết định mơ hồ và hậu quả lớn — chuyển model giữa các bước là feature, không phải thất bại.**
