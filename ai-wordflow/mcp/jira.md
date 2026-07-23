# 🎫 Task Management with Jira MCP

**Jira MCP** cho phép AI giao tiếp trực tiếp với hệ thống quản lý công việc Jira của bạn. Đây là một công cụ mạnh mẽ để thu hẹp khoảng cách giữa **Yêu cầu (Requirements)** và **Mã nguồn (Implementation)**.

---

## 🚀 1. Flow vận hành (Operational Flow)

Kết hợp AI với Jira MCP giúp tự động hóa quy trình phân tích và triển khai ticket theo các bước sau:

1.  **Lấy thông tin (Get Ticket):** AI sử dụng Jira MCP để đọc nội dung của một Issue (Ticket ID).
2.  **Phân tích yêu cầu (Analysis):** AI phân tích mô tả của ticket để hiểu Business Logic.
3.  **Break Task:** AI tự động đề xuất chia nhỏ ticket lớn thành các **Sub-tasks** cụ thể (Frontend, Backend, Database, Testing).
4.  **Phân tích Impact & Solution:** 
    -   **Impact:** AI quét codebase hiện tại để tìm các phần code bị ảnh hưởng nếu triển khai ticket này.
    -   **Solution:** AI đề xuất giải pháp kỹ thuật cụ thể (mẫu code, kiến trúc).
5.  **Cập nhật Jira:** AI tự động tạo các Sub-tasks trên Jira và đính kèm Solution vào phần Comment của ticket chính.

---

## 🔍 2. Phân tích Impact & Giải pháp (Impact & Solution Analysis)

Đây là điểm mạnh nhất khi dùng AI kết hợp với Jira MCP:

-   **Impact Analysis:** AI có thể trả lời câu hỏi: *"Nếu tôi thay đổi logic tính giá ở Ticket JIRA-123, những module nào khác sẽ bị lỗi?"*. Nó sẽ tìm kiếm các reference trong toàn bộ dự án để cảnh báo bạn.
-   **Đề xuất Solution:** Dựa trên context của dự án, AI sẽ viết ra một bản thiết kế chi tiết (Tech Design) ngay trong phần comment của ticket, giúp team Review dễ dàng nắm bắt ý định của bạn.

---

## 🔒 3. Bảo mật & Quản lý Jira Token

Bảo mật là yếu tố sống còn khi cấp quyền cho AI truy cập vào hệ thống nội bộ của công ty.

### 🔑 Cách lấy Jira API Token:
1.  Truy cập vào **Atlassian Account Settings** -> **Security**.
2.  Chọn **Create and manage API tokens**.
3.  Tạo một token mới và đặt tên (ví dụ: `Cursor-Jira-AI`).

### 🛡️ Quy tắc bảo mật:
1.  **Environment Variables:** Tuyệt đối không bao giờ dán trực tiếp Token vào code hay prompt. Hãy lưu nó vào biến môi trường (Ví dụ: `JIRA_API_TOKEN`).
2.  **Least Privilege:** Chỉ cấp quyền tối thiểu cho token (ví dụ: quyền đọc/ghi ticket, không cấp quyền quản trị hệ thống).
3.  **Local Execution:** Khi sử dụng MCP trên Cursor, hãy đảm bảo các file config chứa token được đưa vào `.gitignore` (ví dụ: `mcp_config.json`).
4.  **Token Rotation:** Nên thay đổi (rotate) token định kỳ 3-6 tháng một lần để đảm bảo an toàn.

---

## 💡 Kết luận cho Interview (Sample Answer)

> *"Tôi sử dụng **Jira MCP** để tối ưu hóa quy trình từ lúc nhận ticket đến khi bắt đầu viết code. Thay vì đọc ticket thủ công, tôi để AI phân tích yêu cầu, tự động đánh giá **Impact** lên hệ thống hiện tại và đề xuất **Solution** ngay trong comment của Jira. Điều này giúp giảm thiểu sai sót logic và tiết kiệm thời gian break-task. Về bảo mật, tôi luôn quản lý **Jira API Token** qua các lớp bảo mật như biến môi trường và giới hạn Scope của token để bảo vệ dữ liệu doanh nghiệp."*

---
*Jira MCP biến các Requirement khô khan thành một kế hoạch thực thi kỹ thuật chi tiết.*
