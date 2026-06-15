# Hành vi & kinh nghiệm dự án (phỏng vấn)

> Khung STAR: [star-method.md](./star-method.md)

## Tóm tắt

Nhóm câu **25–28** đánh giá cách làm việc, fit văn hóa, và độ sâu kinh nghiệm — dùng **STAR**, số liệu cụ thể, trung thực.

---

## 25. Khi nhận một yêu cầu, em làm gì đầu tiên?

### Cấu trúc trả lời

1. **Làm rõ yêu cầu** — mục tiêu, scope, deadline, ai dùng, success criteria.
2. **Hỏi constraint** — performance, bảo mật, backward compatible?
3. **Xác nhận hiểu đúng** — paraphrase lại với PM/lead trước khi code.
4. **Chia nhỏ** — task, estimate, risk (dependency, unknown).
5. **Thiết kế sketch** — API, DB, flow (nhẹ nếu task nhỏ).
6. **Align** — review approach nếu ảnh hưởng lớn.
7. **Implement + test + document**.

**Tránh:** nhảy vào code ngay khi requirement mơ hồ.

---

## 26. Hỏi về business dự án

### Chuẩn bị

- **Ai là user?** B2B/B2C, quy mô.
- **Vấn đề business giải quyết** — không chỉ list feature.
- **Mô hình kinh doanh** — subscription, transaction fee...
- **Metric business** — conversion, retention, GMV (nếu ecommerce).
- **Vai trò team bạn** trong value chain.

**Ví dụ:** "Hệ thống order phục vụ 500 shop online VN, peak 11.11 — team em own checkout và payment integration."

---

## 27. Task khó / tối ưu / dự án tâm đắc / bài học

Dùng **STAR** ([star-method.md](./star-method.md)):

| Bước | Backend ví dụ |
|------|----------------|
| **S** | API checkout P99 2s, flash sale 3k TPS |
| **T** | Lead optimize query + cache layer |
| **A** | `EXPLAIN ANALYZE`, composite index, Redis cache-aside, worker pool export |
| **R** | P99 200ms, error rate < 0.1%; học: đo trước optimize, không cache mù |

**Bài học & cải thiện (thật):**
- "Trước đây thiếu integration test → giờ thêm contract test."
- "Monitoring chưa đủ → đã thêm distributed trace."

Chọn **1 câu chuyện sâu** hơn 3 câu chuyện nông.

---

## 28. Bạn biết gì về công ty?

### Trước phỏng vấn

- Đọc **website, JD, LinkedIn, blog tech, sản phẩm**.
- Hiểu: ngành, sản phẩm chính, stack (nếu public), văn hóa.
- Chuẩn bị **2–3 câu hỏi ngược** (team structure, on-call, growth).

### Khung trả lời

1. Sản phẩm/dịch vụ công ty.
2. Lý do apply (fit skill + interest).
3. Điều muốn đóng góp.
4. Câu hỏi cho interviewer.

**Tránh:** đọc nguyên homepage; thiếu sincerity.

---

## Câu trả lời ngắn tổng hợp

Clarify requirement → design nhẹ → align → code. Business: user, problem, metric. Task khó: STAR + số liệu. Công ty: research JD + hỏi ngược có chuẩn bị.
