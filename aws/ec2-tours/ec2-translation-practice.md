# EC2 — Translation Practice (VI -> EN)

> Mục tiêu: dịch đoạn tiếng Việt bên dưới sang tiếng Anh theo văn phong kỹ thuật, rõ ràng, tự nhiên.

## Đề bài

Dịch đoạn sau sang tiếng Anh. Giữ đúng ý kỹ thuật, nhưng có thể tách/gộp câu để câu tiếng Anh mượt hơn.

## Đoạn tiếng Việt

EC2 là dịch vụ máy ảo của AWS, phù hợp khi bạn cần toàn quyền kiểm soát hệ điều hành, mạng và cách triển khai ứng dụng. Trong một hệ thống backend điển hình, nhóm kỹ thuật thường bắt đầu bằng một instance nhỏ để chạy API, sau đó tách dần các thành phần như database, cache và hàng đợi khi tải tăng. Khi tạo EC2, bạn cần chọn AMI phù hợp, loại instance theo CPU/RAM, và cấu hình Security Group đủ chặt để chỉ mở các cổng cần thiết như SSH hoặc HTTP/HTTPS. Về lưu trữ, EBS cho phép giữ dữ liệu bền vững, nhưng bạn vẫn phải thiết kế backup định kỳ vì lỗi thao tác hoặc xóa nhầm vẫn có thể xảy ra.

EC2 is a virtual machine service from AWS, it is suitable when you need full control the operating system, networking and application deployment. In a typical backend system, engineering teams ussually start with a small instance to run the API, then gradually split out components such as database, cache and message when the load grows. When you create an EC2 instance, you need choose a suitable AMI, 

Ở môi trường production, không nên đặt toàn bộ hệ thống trên một EC2 duy nhất vì đó là single point of failure. Cách an toàn hơn là đặt nhiều instance phía sau Application Load Balancer, dùng health check để tự động loại máy lỗi, và kết hợp Auto Scaling Group để tăng hoặc giảm số lượng máy theo CPU, request count hoặc lịch thời gian. Nếu ứng dụng có trạng thái phiên (session), bạn cần xử lý sticky session hoặc đưa session ra ngoài bằng Redis để tránh lỗi khi request đi vào các máy khác nhau. Ngoài ra, cần bật giám sát bằng CloudWatch, thu thập log tập trung, và đặt cảnh báo cho CPU cao, disk đầy, memory pressure và trạng thái health check thất bại.

In production, you should not put the entire system on a single EC2 instance because that is a single point of failure. A safer approach is to place multiple instances behind an ALB, use health check to automatically remove unhealthy instances, and combine this with an ASG to increase or decrease the number of instances based on CPU, request count or schedule time. If the application has session state, you need sticky sessions or you should move sessions out to Redis to avoid errors when requests go to different instances.

Tóm lại, EC2 rất linh hoạt và mạnh, nhưng đổi lại bạn phải tự chịu trách nhiệm nhiều hơn về vận hành: vá bảo mật, xoay key, quản lý quyền truy cập, chiến lược backup và kế hoạch khôi phục sự cố. Nếu đội ngũ chưa mạnh về vận hành hạ tầng, nên bắt đầu đơn giản, tự động hóa dần bằng script hoặc IaC, và liên tục diễn tập quy trình khôi phục trước khi traffic tăng mạnh.

## Checklist tự soát sau khi dịch

- Đúng thuật ngữ: `instance`, `AMI`, `Security Group`, `EBS`, `Load Balancer`, `Auto Scaling Group`, `health check`.
- Đúng ngữ pháp: chủ-vị, article (`a/an/the`), giới từ (`on`, `for`, `with`, `behind`).
- Câu mạch lạc: có từ nối nguyên nhân/kết quả (`because`, `so`, `therefore`, `however`).
- Không dịch word-by-word nếu làm câu cứng; ưu tiên nghĩa đúng và tự nhiên.
