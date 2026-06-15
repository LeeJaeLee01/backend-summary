# Câu hỏi phỏng vấn Golang / Backend

## 1. Nội dung tập trung phỏng vấn dự án

### Thông tin dự án
- Loại: Product / Outsource
- Khách hàng
- End user
- Mô hình vận hành: On Premise / Cloud SaaS...
- Business: Ecommerce / Ads / Security / Game / Blockchain...
- Nền tảng: Web App / Mobile App / Desktop App...
- Hiện trạng: đang phát triển / đã triển khai / ngừng triển khai
- Quy mô: số lượng users / events ...
- Team size

### Công nghệ
- Ngôn ngữ lập trình, framework
- Microservice / Monolithic
- Công nghệ đóng gói triển khai
- Công nghệ vận hành

### Vai trò và mức độ tham gia của ứng viên
- Quản lý dự án
- Tech lead (Lựa chọn công nghệ, thiết kế hệ thống, code review)
- Lập trình
- DevOps
- Các công việc khác (test, viết tài liệu, CSKH,...)

### Bài toán công nghệ đã tham gia giải quyết
- Xây dựng/thiết kế hệ thống / Lựa chọn công nghệ cho dự án
- Thiết kế hệ thống rõ ràng, trong sáng, để phục vụ các luồng nghiệp vụ phức tạp
- Nghiên cứu, đi sâu làm chủ, tối ưu công nghệ core
- Tối ưu hiệu năng / tối ưu tốc độ truy vấn
- Xử lý dữ liệu lớn
- Mô tả sơ bộ về bài toán và cách giải quyết

### Chỉ số hệ thống
- Số lượng CCU (concurrent user) của hệ thống (khoảng 500–1000)
- Lượng transaction per second (TPS) của hệ thống xử lý được
- Trong trường hợp tải cao hơn khả năng thì mở rộng hay xử lý ra sao?
- Hệ thống có khả năng chia tải như thế nào?

---

## 2. Câu hỏi kỹ thuật

> **Ghi chú:** Vị trí Golang — tập trung lý thuyết và kinh nghiệm thực tế.

### Database & query

1. Xử lý đa luồng, tranh chấp dữ liệu — race condition trong Go → [race-condition.md](./race-condition.md)
2. Luồng đang xử lý bị chết / deadlock — cách xử lý → [deadlock.md](./deadlock.md)
3. Sự khác biệt giữa indexing và partitioning trong DB → [indexing-vs-partitioning.md](./indexing-vs-partitioning.md)
4. Đánh index với những dữ liệu như nào? Các loại index phù hợp từng case → [when-to-index.md](./when-to-index.md)
5. Tối ưu câu SQL (các bước) & đánh giá query hiệu quả → [sql-optimization.md](./sql-optimization.md)

### Kiến trúc hệ thống

6. Toàn vẹn dữ liệu giữa các microservice (+ thứ tự xử lý luồng nghiệp vụ bất đồng bộ) → [microservice-data-consistency.md](./microservice-data-consistency.md)
7. Monolithic vs microservice — khác biệt, ưu nhược → [monolith-vs-microservice.md](./monolith-vs-microservice.md)

### Go — concurrency & runtime

8. `defer` trong goroutine · Channel · Worker pool (giới hạn concurrency) → [go-defer-channel.md](./go-defer-channel.md)
9. Các nguyên tắc lập trình an toàn → [safe-programming.md](./safe-programming.md)

### API, network & data store

10. So sánh RESTful với gRPC — tại sao gRPC nhanh hơn? → [rest-vs-grpc.md](./rest-vs-grpc.md)
11. Connection pool → [connection-pool.md](./connection-pool.md)
12. NoSQL vs SQL — case cụ thể chọn loại nào → [nosql-vs-sql.md](./nosql-vs-sql.md)
13. Cache — các loại, Redis (thuật toán, chiến lược, triển khai) → [cache-redis.md](./cache-redis.md)
14. JWT — luồng đăng nhập, verify access_token → [jwt-auth.md](./jwt-auth.md)
15. Redis Queue vs RabbitMQ — khi nào dùng loại nào → [message-queue.md](./message-queue.md)

### DevOps & hạ tầng

16. Docker — Dockerfile (tối ưu thời gian, dung lượng, bảo mật) → [docker.md](./docker.md)
17. CI/CD — luồng triển khai (GitLab → Jenkins → Helm → ArgoCD → K8s) → [cicd.md](./cicd.md)
18. Kubernetes — các resource cơ bản → [kubernetes.md](./kubernetes.md)

### Lý thuyết & thuật toán

19. OOP, SOLID, design pattern, clean code → [oop-solid-patterns.md](./oop-solid-patterns.md)
20. Bài toán thuật toán (~< Medium LeetCode) → [algorithms-interview.md](./algorithms-interview.md)
21. Hiểu biết code C → [c-for-go-devs.md](./c-for-go-devs.md)
22. Bất đồng bộ NodeJS *(nếu JD/stack có Node)* → [nodejs-async.md](./nodejs-async.md)

### Hành vi & kinh nghiệm dự án

23–26. Yêu cầu mới, business, task khó, công ty → [behavioral-interview.md](./behavioral-interview.md) · [star-method.md](./star-method.md)

### Bài toán tình huống

27. Hàng đợi cứ mở rộng khi nhiều user access → [scenario-queue-backpressure.md](./scenario-queue-backpressure.md)
28. Export data hàng triệu bản ghi → [scenario-export-data.md](./scenario-export-data.md)
