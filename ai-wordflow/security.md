# 🛡️ AI & Security in Software Development

Sử dụng AI trong phát triển phần mềm mang lại hiệu suất cao nhưng cũng đi kèm với các rủi ro bảo mật nghiêm trọng. Dưới đây là các vấn đề chính và cách đảm bảo an toàn cho dự án.

---

## ⚠️ 1. Các rủi ro bảo mật chính (Main Risks)

### ❌ Rò rỉ dữ liệu nhạy cảm (Data Leakage)
- **Vấn đề:** Các thông tin như API Keys, Passwords, hay thông tin khách hàng nhạy cảm có thể vô tình được đưa vào prompt hoặc codebase mà AI đang index.
- **Hậu quả:** Dữ liệu này có thể được dùng để training cho các model AI tiếp theo, khiến bí mật của công ty bị lộ ra bên ngoài.

### 🛡️ Lỗ hổng trong code AI tạo ra (Vulnerable Code)
- **Vấn đề:** AI có thể tạo ra code hoạt động được nhưng không an toàn (ví dụ: SQL Injection, XSS, hoặc sử dụng các thư viện đã lỗi thời có lỗ hổng).
- **Hậu quả:** Kẻ tấn công có thể khai thác các lỗ hổng này để xâm nhập hệ thống.

### 🧩 Sự phụ thuộc quá mức (Over-reliance)
- **Vấn đề:** Developer tin tưởng hoàn toàn vào AI mà không kiểm tra kỹ (Code Review).
- **Hậu quả:** Các lỗi logic hoặc lỗi bảo mật tinh vi sẽ bị bỏ qua.

---

## 🔒 2. Cách đảm bảo Security cho dự án (Best Practices)

### ✅ Quy tắc 1: Code Review là bắt buộc
- **Action:** Luôn luôn đọc và kiểm tra kỹ từng dòng code mà AI generate ra trước khi merge.
- **Focus:** Kiểm tra các hàm xử lý dữ liệu đầu vào, phân quyền (Authentication/Authorization) và các logic quan trọng.

### ✅ Quy tắc 2: Quản lý Secrets nghiêm ngặt
- **Action:** Sử dụng file `.env` cho các thông tin nhạy cảm và đảm bảo đã đưa vào `.gitignore`.
- **Tip:** Sử dụng các công cụ quét secret (như `git-secrets` hoặc `TruffleHog`) để ngăn chặn việc commit nhạy cảm lên GitHub.

### ✅ Quy tắc 3: Làm sạch dữ liệu trước khi hỏi AI
- **Action:** Nếu cần hỏi AI về một lỗi cụ thể, hãy ẩn danh (anonymize) hoặc thay thế các thông tin nhạy cảm (tên khách hàng, IP server, Database name) bằng các tên giả định.

### ✅ Quy tắc 4: Sử dụng các dịch vụ AI tin cậy
- **Action:** Ưu tiên các phiên bản AI Enterprise hoặc các công cụ có cam kết **"Zero Data Retention"** (không lưu lại dữ liệu để training model).
- **Note:** Kiểm tra kỹ chính sách bảo mật của các công cụ như Cursor, GitHub Copilot để biết dữ liệu của bạn được xử lý như thế nào.

### ✅ Quy tắc 5: Tăng cường công cụ quét bảo mật (SAST/DAST)
- **Action:** Sử dụng các công cụ như **Snyk, SonarQube, hoặc GitHub Advanced Security** để tự động quét codebase. AI có thể tạo ra lỗi, nhưng các công cụ này sẽ giúp bạn bắt được chúng.

---

## 💡 Kết luận cho Interview (Sample Answer)

> *"Khi tích hợp AI vào quy trình làm việc, tôi luôn đặt **Security First**. Tôi coi code từ AI chỉ là 'bản thảo' và luôn thực hiện **Code Review** thủ công để đảm bảo không có lỗ hổng như SQL Injection. Ngoài ra, tôi tuân thủ nghiêm ngặt việc quản lý **Secrets** qua biến môi trường và sử dụng các công cụ như **Snyk** để quét bảo mật định kỳ, đảm bảo rằng sự hiệu quả của AI không đi kèm với rủi ro cho dự án."*

---
*Bảo mật là trách nhiệm của con người, không phải của AI.*
