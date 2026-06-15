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

1. Xử lý đa luồng, tranh chấp dữ liệu — race condition trong Go → [race-condition.md](./race-condition.md)
2. Luồng đang xử lý bị chết thì có các cách xử lý như nào? (deadlock)
3. Sự khác biệt giữa indexing và partitioning trong DB
4. Đánh index với những dữ liệu như nào?
5. Tối ưu câu SQL như nào (các bước)? Làm cách nào để biết câu SQL đó có tối ưu hay không?
6. Kiến trúc microservice — làm thế nào để toàn vẹn thống nhất dữ liệu giữa các service?
7. Sự khác biệt, ưu điểm, nhược điểm giữa monolithic và microservice
8. Khi nhận 1 yêu cầu, em sẽ làm gì đầu tiên?
9. Hỏi về business dự án
10. Những task khó đã làm, tối ưu
11. Bài toán giải quyết vấn đề:
    - Khi nhiều người dùng access thì hàng đợi sẽ cứ mở rộng mãi, em xử lý như thế nào?
    - Khi muốn export data hàng triệu bản ghi thì làm thế nào?
12. Dự án nào em thấy tâm đắc nhất?
13. Một số câu hỏi lý thuyết: JWT, cache, OOP, Dockerfile, SOLID, design pattern, clean code
14. Vị trí này sẽ vào làm Golang nên sẽ tập trung hỏi nhiều về lý thuyết và kinh nghiệm
15. Chỉ ra vài bài toán thực tế → một vài tình huống giả định, những điều gì học được rồi cần cải thiện cái gì?
16. Bạn biết gì về công ty chúng tôi? (đọc trong profile công ty và JD)
17. Quy trình DevOps — hỏi nhiều về Docker
18. Hỏi khá sâu về index
19. `defer` trong goroutine
20. Channel
21. Bài toán xử lý bất đồng bộ
22. So sánh RESTful với gRPC — tại sao gRPC lại nhanh hơn?
23. Connection pool
24. Bài toán về thuật toán
25. Các loại cache, sử dụng như nào?
26. Các nguyên tắc lập trình an toàn
27. Tối ưu query, database
28. Đảm bảo thứ tự xử lý một luồng nghiệp vụ (trong môi trường microservice và bất đồng bộ)
29. Hiểu biết code C
30. Kiến thức về K8s (hiểu biết về các resource)
31. Deadlock
32. Cách tối ưu thời gian, dung lượng và bảo mật khi viết Dockerfile
33. Các loại index — index nào phù hợp trong trường hợp nào, ưu và nhược điểm. Đưa example cho tất cả các loại
34. NoSQL và SQL khác nhau như thế nào? Đưa ra ví dụ trong case cụ thể tại sao dùng loại này mà không phải loại kia
35. Mock code tình huống (mô tả cách giữ tối đa 5 tasks chạy đồng thời trong một thời điểm với NodeJS) và một bài thuật toán (khoảng < Medium LeetCode)
36. Bất đồng bộ trong NodeJS (MicroTask Queue, Event Queue, Event Loop, Thread pool, thread, Call Stack)
37. Một luồng CI/CD với stack của bạn (GitLab → Jenkins → Git Helm Manager → ArgoCD → K8S)
38. Cách tối ưu query — mô tả chi tiết từng bước và đánh giá thế nào là một query hiệu quả
39. Mô tả luồng đăng nhập (với JWT — đến đoạn verify access_token thì được hỏi verify thế nào; nói sử dụng crypto thì hỏi tiếp thuật toán gì, cấu trúc thế nào)
40. Redis Caching triển khai thế nào? Thuật toán là gì? Chiến lược là gì?
41. Redis Queue khác gì loại queue khác (RabbitMQ)? Trường hợp nào dùng loại queue nào và tại sao?
