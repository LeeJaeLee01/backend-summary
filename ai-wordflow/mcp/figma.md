# 🎨 UI Development with Figma MCP

**Figma MCP** cho phép AI truy cập trực tiếp vào các tệp thiết kế trên Figma để trích xuất dữ liệu và chuyển đổi chúng thành mã nguồn (Design-to-Code) một cách chính xác tuyệt đối.

---

## 🚀 1. Flow vận hành (Operational Flow)

Sử dụng Figma MCP giúp loại bỏ việc "đo đạc thủ công" và làm giao diện nhanh hơn:

1.  **Kết nối (Connection):** Bạn cung cấp Figma URL cho AI (yêu cầu node ID cụ thể nếu cần).
2.  **Kiểm tra thiết kế (Inspection):** AI sử dụng Figma MCP để đọc các thông số chi tiết của từng lớp (layer), bao gồm:
    -   **Typography:** Font-size, Font-weight, Line-height.
    -   **Colors:** Mã màu (HEX/RGBA), Gradients.
    -   **Layout:** Spacing (padding/margin), Flexbox/Grid properties, Size (width/height).
    -   **Assets:** Export image, icons dạng SVG.
3.  **Ánh xạ Component (Mapping):** AI phân tích các thành phần UI (như Button, Input, Modal) và tìm các component tương ứng trong thư viện code của bạn (ví dụ: Shadcn/UI hoặc MUI).
4.  **Sinh mã (Code Generation):** AI viết code (HTML/React/CSS/Tailwind) dựa trên dữ liệu thật từ thiết kế thay vì chỉ nhìn hình ảnh.

---

## ✨ 2. Lợi ích cốt lõi (Core Benefits)

### 📏 Độ chính xác tuyệt đối (No More "Eyeballing")
- AI đọc thông số từ API của Figma nên các khoảng cách (spacing), kích thước và màu sắc luôn khớp 100% với Spec. Bạn không cần phải đoán hay dùng công cụ thước kẻ trên trình duyệt.

### 🧩 Đồng bộ Design System
- Nếu team Design dùng Design System (Styles/Tokens), AI có thể đọc được tên các biến màu/font để sử dụng đúng class Tailwind hoặc CSS Variable trong project.

### ⚡ Tốc độ dựng UI
- Việc dựng một Layout phức tạp có thể giảm từ vài giờ xuống còn vài phút nhờ khả năng "nhìn thấu" cấu trúc Flexbox/Grid của AI thông qua Figma MCP.

---

## 🔒 3. Bảo mật & Figma Token

Để sử dụng Figma MCP, bạn cần tạo một **Personal Access Token (PAT)**.

- **Cách lấy:** Vào **Figma Settings** -> **Personal access tokens** -> **Generate new token**.
- **Quản lý:** Tương tự các MCP khác, hãy lưu token này vào biến môi trường hoặc file config được `.gitignore`. Tuyệt đối không share token này công khai.

---

## 💡 Kết luận cho Interview (Sample Answer)

> *"Trong quy trình phát triển Frontend, tôi sử dụng **Figma MCP** để thu hẹp khoảng cách giữa Design và Code. Thay vì chỉ nhìn ảnh và đoán thông số, tôi cho phép AI truy cập trực tiếp vào Figma API để lấy các thông số chính xác về Spacing, Typography và Color. Điều này giúp tôi dựng UI nhanh hơn, đảm bảo tính nhất quán của **Design System** và quan trọng nhất là đạt tới độ chính xác 'Pixel Perfect' mà không tốn nhiều thời gian đo đạc thủ công."*

---
*Figma MCP biến bản vẽ thành mã nguồn chỉ trong vài giây.*
