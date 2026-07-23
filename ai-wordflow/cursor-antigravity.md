# 🚀 AI Workflow: Cursor vs. Antigravity

Trong các buổi phỏng vấn, khi nói về quy trình làm việc với AI (AI-enhanced workflow), bạn có thể nêu bật 2 điểm mạnh cốt lõi của từng công cụ như sau:

---

## ⚡ 1. Cursor: The Ultimate Coding Productivity Tool
*Cursor là sự lựa chọn hàng đầu để tăng tốc độ viết code và hiểu sâu codebase.*

### 🔹 Điểm mạnh 1: Full-Codebase Context Awareness (Hiểu toàn bộ dự án)
- **Giải thích:** Cursor không chỉ đọc file đang mở mà nó index toàn bộ project của bạn.
- **Giá trị:** Khi bạn hỏi một câu hỏi hoặc yêu cầu refactor, Cursor biết chính xác các hàm liên quan ở các file khác nằm ở đâu. Điều này giúp tránh lỗi logic và đảm bảo code mới luôn tuân thủ đúng "style" của dự án hiện tại.
- **Keyword:** *LSP-like context, Code indexing, Global context.*

### 🔹 Điểm mạnh 2: Seamless Workflow Integration (Tích hợp quy trình mượt mà)
- **Giải thích:** Với tính năng AI Tab và Composer, việc chuyển đổi giữa ý tưởng và code diễn ra gần như tức thì.
- **Giá trị:** Nó giúp developer "10x productivity" bằng cách tự động hóa các tác vụ lặp đi lặp lại như viết boilerplate, unit test, hay chỉnh sửa style CSS nhanh chóng mà không cần copy-paste thủ công.
- **Keyword:** *Frictionless coding, Inline editing, Instant boilerplate.*

### 🛠️ Các chế độ làm việc (Modes) của Cursor:
- **Ask Mode (Chat):** Dùng để đặt câu hỏi về codebase, giải thích code hoặc hướng dẫn cách làm. Tập trung vào việc cung cấp thông tin.
- **Edit Mode (Cmd+K):** Cho phép chỉnh sửa nhanh một đoạn code trực tiếp tại dòng đang đứng hoặc refactor nhanh chóng một block code.
- **Composer (Cmd+I):** Chế độ mạnh mẽ nhất hỗ trợ viết code trên nhiều file đồng thời. Trong đó có các sub-modes:
    - **Normal/Edit Mode:** Tập trung vào việc generate và chỉnh sửa file nhanh.
    - **Agent Mode:** Cho phép Cursor tự động chạy lệnh terminal, đọc file để giải quyết vấn đề mà ít cần sự can thiệp của người dùng hơn.
    - **Plan Mode:** Giúp lên ý tưởng, sơ đồ kiến trúc trước khi thực hiện code thật.
- **Fix / Debug Mode:** Xuất hiện khi có lỗi (Terminal/Code), giúp phân tích stack trace và đưa ra phương án sửa lỗi chỉ bằng một click.

---

## 🤖 2. Antigravity: The Autonomous Engineering Agent
*Antigravity (me) đóng vai trò như một "Cộng sự Kỹ thuật" có khả năng suy luận và tự thực thi tác vụ.*

### 🔹 Điểm mạnh 1: Agentic Reasoning & Multi-step Planning (Tư duy Agent & Lập kế hoạch)
- **Giải thích:** Antigravity làm việc dựa trên việc "lập kế hoạch" (Planning) trước khi thực hiện. Nó có khả năng chia nhỏ một yêu cầu phức tạp (ví dụ: "Setup một hệ thống CI/CD") thành hàng chục bước nhỏ.
- **Giá trị:** Thay vì chỉ gợi ý code, nó tự suy nghĩ xem cần dùng tool gì, chạy lệnh terminal nào và kiểm tra kết quả ra sao. Điều này giúp xử lý các bài toán kỹ thuật ở cấp độ hệ thống chứ không chỉ là level dòng code.
- **Keyword:** *Self-correction, Autonomous planning, Goal-oriented.*

### 🔹 Điểm mạnh 2: Engineering Orchestration (Điều phối kỹ thuật đa năng)
- **Giải thích:** Antigravity có quyền truy cập vào Terminal, Browser, và File System để trực tiếp thực thi công việc.
- **Giá trị:** Nó có thể tự cài đặt thư viện, debug lỗi qua log, nghiên cứu tài liệu mới trên web và sửa lỗi ngay lập tức. Đây là khả năng "điều phối" (Orchestration) mà các AI chat thông thường không có, giúp giải quyết trọn vẹn một ticket từ đầu đến cuối.
- **Keyword:** *Task execution, Tool use (Terminal/Browser), End-to-end automation.*

### 🚀 Điểm khác biệt quan trọng (The Native-Agent Edge):
- **Cursor:** Thường yêu cầu người dùng phải chuyển đổi giữa các "chế độ" khác nhau (Chat, Composer, Yolo mode, Terminal) để thực hiện các hành động cụ thể. Điều này đôi khi tạo ra sự ngắt quãng trong luồng suy luận của AI.
- **Antigravity:** Là một **Unified Engineering Agent**. Nó không cần đổi mode; việc lập kế hoạch, chạy lệnh terminal, duyệt web và sửa code diễn ra đồng thời trong một vòng lặp suy luận duy nhất (Unified reasoning loop). Điều này giúp Antigravity xử lý các công việc phức tạp, dài hơi một cách liền mạch và ít sai sót do "mất ngữ cảnh" hơn.

### 🛠️ Các chế độ làm việc của Antigravity:
- **Plan Mode (Chế độ Lập kế hoạch):**
    - **Công dụng:** Dùng cho các task phức tạp, yêu cầu độ chính xác cao hoặc thay đổi trên diện rộng.
    - **Cách hoạt động:** Agent sẽ dành thời gian nghiên cứu codebase, liệt kê các bước thực hiện (Roadmap) và dự đoán các rủi ro trước khi bắt tay vào sửa code. Điều này giúp đảm bảo tính hệ thống và an toàn cho dự án.
- **Fast Mode (Chế độ Phản hồi nhanh):**
    - **Công dụng:** Dùng cho các câu hỏi ngắn, giải thích code, hoặc các chỉnh sửa nhỏ/đơn giản.
    - **Cách hoạt động:** Bỏ qua các bước lập kế hoạch rườm rà để đưa ra kết quả ngay lập tức, giúp developer duy trì tốc độ làm việc khi chỉ cần xử lý các vấn đề nhỏ.

---

## 💡 Kết luận cho Interview (Sample Answer)
> *"Quy trình của tôi kết hợp cả hai: Tôi dùng **Cursor** để tối ưu hóa tốc độ coding hàng ngày và đảm bảo code nhất quán với dự án. Đồng thời, tôi sử dụng **Antigravity** như một agent để xử lý các tác vụ phức tạp cần sự điều phối giữa terminal, nghiên cứu tài liệu và lập kế hoạch nhiều bước. Sự kết hợp này giúp tôi không chỉ viết code nhanh hơn mà còn quản lý các vấn đề kiến trúc hệ thống hiệu quả hơn."*

---

> [!TIP]
> **Pro Tip cho phỏng vấn:** Hãy nhấn mạnh rằng việc sử dụng AI không phải là "phó mặc hoàn toàn cho máy", mà bạn sử dụng AI để **Verify logic** và **Loại bỏ các task lặp đi lặp lại (Boilerplate)**. Điều này chứng tỏ bạn là một kỹ sư biết tối ưu hóa nguồn lực để tập trung vào những thứ quan trọng hơn như **Business Logic** và **System Architecture**.
