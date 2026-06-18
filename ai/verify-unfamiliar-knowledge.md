# Xác minh câu trả lời AI khi bạn ít biết chủ đề

## Tóm tắt một câu

Khi bạn **không đủ nền** để tự đánh giá, đừng hỏi "câu này đúng không?" — hãy hỏi **"làm sao tôi có thể kiểm tra được?"** và chạy một **quy trình xác minh có bằng chứng**, không dựa vào cảm giác.

---

## Vấn đề cốt lõi

AI (và cả người) có thể trả lời **nghe hợp lý nhưng sai**:

- Trộn đúng thuật ngữ với chi tiết bịa
- Đúng ở mức cao, sai ở edge case hoặc version cụ thể
- Lỗi thời — đúng năm trước, sai hôm nay
- Thiên vị xác nhận — nói đúng điều bạn muốn nghe

**Bạn không cần hiểu hết** mới xác minh được. Bạn cần **cách kiểm tra độc lập**.

---

## Quy trình 5 bước

```
1. Làm rõ claim     →  AI đang khẳng định điều gì, cụ thể đến mức nào?
2. Phân loại claim  →  Fact / quy ước / ý kiến / code có thể chạy?
3. Tìm nguồn độc lập →  Không hỏi lại cùng AI bằng cách khác
4. Chạy falsification →  Cố gắng chứng minh nó SAI
5. Gán mức tin cậy  →  Chưa verify thì chưa dùng cho quyết định quan trọng
```

---

## Bước 1 — Trích xuất claim rõ ràng

Đừng chấp nhận câu trả lời mơ hồ. Viết lại thành các câu có thể đúng/sai:

| Câu trả lời AI (mơ hồ) | Claim có thể kiểm tra |
|------------------------|------------------------|
| "Redis pub/sub đáng tin cậy cho payment" | "Redis pub/sub **không đảm bảo** message delivery nếu subscriber offline" |
| "Nên dùng saga cho mọi distributed transaction" | "Saga phù hợp khi **không cần isolation mạnh** giữa các bước" |
| "Go channel an toàn luôn" | "Gửi vào channel đã **close** sẽ panic" |

**Prompt hữu ích:**

```text
Liệt kê 3–5 khẳng định cụ thể nhất trong câu trả lời vừa rồi.
Mỗi claim: (1) có thể sai không? (2) version/context nào? (3) nguồn chính thức nào?
```

---

## Bước 2 — Phân loại claim (cách verify khác nhau)

| Loại | Ví dụ | Cách verify nhanh |
|------|-------|-------------------|
| **Fact kỹ thuật** | "Kafka default retention 7 ngày" | Docs chính thức, config mặc định trong source |
| **Hành vi runtime** | "Goroutine leak khi quên đọc channel" | Viết snippet nhỏ, chạy, quan sát |
| **Best practice** | "Không nên dùng float cho tiền" | Nhiều nguồn uy tín đồng thuận; biết trade-off |
| **Kiến trúc / trade-off** | "Event-driven phù hợp hơn sync ở scale lớn" | Không có đúng/sai tuyệt đối — cần điều kiện & counterexample |
| **Số liệu / thị trường** | "iKame Top 5 publisher" | Báo cáo ngành, ngày publish, metric đo gì |

**Rule:** Chỉ claim loại **fact** và **runtime** mới có thể verify chắc. Best practice chỉ đạt **mức tin cậy trung bình** nếu chưa test trong context của bạn.

---

## Bước 3 — Nguồn độc lập (không tin một kênh)

Thứ tự ưu tiên khi verify kiến thức kỹ thuật:

1. **Tài liệu chính thức** — docs của framework, RFC, spec
2. **Source code / changelog / release notes** — đặc biệt khi docs lỗi thời
3. **Thực nghiệm nhỏ** — REPL, unit test, `curl`, PoC 20–50 dòng
4. **Hai nguồn độc lập** — blog + docs, hoặc 2 docs khác section
5. **Chuyên gia có trách nhiệm** — reviewer, mentor (cuối cùng, không thay 1–3)

**Tránh:**

- Hỏi lại **cùng model** "bạn chắc không?" → thường xác nhận lại lỗi cũ
- Chỉ đọc **một blog** không date, không author
- Tin **Stack Overflow cũ** không check version

**Prompt hữu ích:**

```text
Claim: "<paste claim>"
Đưa link docs chính thức (không blog) và trích đoạn ngắn hỗ trợ hoặc bác bỏ.
Nếu không có nguồn chính thức, nói rõ "không verify được".
```

---

## Bước 4 — Falsification (cố chứng minh nó sai)

Đây là bước quan trọng nhất khi bạn ít biết chủ đề.

| Câu hỏi falsify | Mục đích |
|-----------------|----------|
| **Counterexample?** | Trường hợp nào claim không đúng? |
| **Version nào?** | Go 1.18 vs 1.22, Redis 6 vs 7, K8s 1.28 vs 1.30 |
| **Giả định ẩn?** | Single node vs cluster? At-least-once vs exactly-once? |
| **Đảo ngược claim?** | Nếu làm ngược lại có crash / mất data không? |

**Prompt hữu ích:**

```text
Giả sử claim trên SAI. Mô tả 2 scenario cụ thể khiến nó fail.
Nếu không nghĩ ra được, claim có thể quá chung chung.
```

Nếu AI không đưa được counterexample hoặc edge case → **giảm tin cậy**.

---

## Bước 5 — Mức tin cậy trước khi hành động

| Mức | Điều kiện | Được phép làm gì |
|-----|-----------|------------------|
| **Thấp** | Chỉ nghe AI, chưa có nguồn khác | Ghi chú, học thêm — **không** design production |
| **Trung bình** | Docs + 1 nguồn phụ, chưa chạy thử | Spike / PoC, hỏi mentor |
| **Cao** | Docs + thực nghiệm reproduce được | Áp dụng vào code / doc nội bộ |
| **Rất cao** | Trên + review người có kinh nghiệm domain | Merge, quyết định kiến trúc |

**Rule cứng:** Quyết định ảnh hưởng **data, tiền, security, SLA** → cần ít nhất **Cao**, không chỉ nghe AI.

---

## Checklist nhanh (5 phút)

Trước khi tin một câu trả lời về chủ đề lạ:

- [ ] Tôi viết được **1 câu claim** cụ thể từ câu trả lời
- [ ] Tôi biết claim thuộc loại **fact / opinion / trade-off**
- [ ] Tôi đã mở **ít nhất 1 nguồn không phải AI** (docs, code, paper)
- [ ] Tôi đã hỏi **"khi nào sai?"** hoặc **"version nào?"**
- [ ] Nếu là code/API: tôi đã **chạy thử** hoặc lên kế hoạch PoC ngắn
- [ ] Tôi ghi **mức tin cậy** và điều còn chưa verify

---

## Dấu hiệu cảnh báo trong câu trả lời AI

| Red flag | Ý nghĩa |
|----------|---------|
| Không nêu version / ngữ cảnh | Dễ đúng chung chung, sai cụ thể |
| "Luôn luôn" / "Không bao giờ" | Hiếm khi đúng trong hệ thống phân tán |
| Trích dẫn paper/blog không link | Khó verify, có thể hallucinate |
| Code quá dài, không chạy được ngay | Tăng rủi ro lỗi nhỏ gây hiểu sai lớn |
| Đổi câu trả lời khi hỏi lại nhẹ | Claim ban đầu không vững |
| Số liệu quá tròn, không nguồn | "Top 1", "10x faster" — cần metric & date |

---

## Chiến lược theo mức độ quan trọng

### Học / ghi chú cá nhân

- Trích claim + 1 link docs
- Tin mức **Trung bình** là đủ để tiếp tục đọc

### Viết doc / trả lời phỏng vấn

- Verify fact bằng docs + falsify 1 edge case
- Ghi rõ "theo docs X, version Y"

### Code production / thiết kế hệ thống

- PoC bắt buộc cho hành vi không chắc
- Review người có domain knowledge
- Không copy-paste snippet lớn chưa chạy

---

## Template ghi chú verify

Copy vào journal khi học chủ đề mới:

```markdown
## Chủ đề: ...
**Claim từ AI:** ...
**Loại:** fact | behavior | best-practice | trade-off
**Nguồn độc lập:** [link docs]
**Falsify / edge case:** ...
**Đã thử:** (lệnh / snippet / kết quả)
**Mức tin cậy:** thấp | trung bình | cao
**Còn chưa verify:** ...
```

---

## Liên quan

- [ai-index.md](./ai-index.md) — quy trình AI trong repo; mục "Bằng chứng trước khi hoàn thành"
- Nguyên tắc chung: **evidence before assertion** — không tin vì nghe hợp lý, tin vì kiểm tra được
