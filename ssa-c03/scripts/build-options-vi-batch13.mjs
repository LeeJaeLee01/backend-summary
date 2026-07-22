#!/usr/bin/env node
import { writeBatch } from './build-options-vi-batches.mjs';

const T = {
  337: {
    questionVi:
      'Một công ty đã triển khai ứng dụng web trên AWS. Backend database dùng Amazon RDS for MySQL với primary DB instance và năm read replica để scale. Read replica phải lag không quá 1 giây so với primary. Database thường chạy stored procedure theo lịch. Khi traffic website tăng, replica lag thêm trong peak load. Kiến trúc sư giải pháp phải giảm replication lag tối đa, tối thiểu thay đổi application code và operational overhead. Giải pháp nào đáp ứng?',
    optionsVi: {
      A: 'Di chuyển database sang Amazon Aurora MySQL. Thay read replica bằng Aurora Replica, cấu hình Aurora Auto Scaling. Thay stored procedure bằng hàm native Aurora MySQL.',
      B: 'Triển khai Amazon ElastiCache for Redis trước database. Sửa application kiểm tra cache trước khi query database. Thay stored procedure bằng AWS Lambda functions.',
      C: 'Di chuyển database sang MySQL chạy trên Amazon EC2. Chọn EC2 compute optimized lớn cho tất cả replica node. Giữ stored procedure trên EC2.',
      D: 'Di chuyển database sang Amazon DynamoDB. Cấp nhiều read capacity units (RCU) đáp ứng throughput, bật on-demand capacity scaling. Thay stored procedure bằng DynamoDB streams.',
    },
  },
  338: {
    questionVi:
      'Kiến trúc sư giải pháp phải tạo disaster recovery (DR) plan cho nền tảng SaaS high-volume. Toàn bộ dữ liệu lưu trong Amazon Aurora MySQL DB cluster. DR plan phải replicate dữ liệu sang AWS Region phụ. Giải pháp nào HIỆU QUẢ CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng MySQL binary log replication sang Aurora cluster ở Region phụ. Cấp một DB instance cho Aurora cluster ở Region phụ.',
      B: 'Thiết lập Aurora global database cho DB cluster. Sau khi hoàn tất, xóa DB instance khỏi Region phụ.',
      C: 'Dùng AWS Database Migration Service (AWS DMS) replicate liên tục sang Aurora cluster ở Region phụ. Xóa DB instance khỏi Region phụ.',
      D: 'Thiết lập Aurora global database cho DB cluster. Chỉ định tối thiểu một DB instance ở Region phụ.',
    },
  },
  339: {
    questionVi:
      'Một công ty có ứng dụng tùy chỉnh với embedded credentials lấy thông tin từ Amazon RDS MySQL DB instance. Ban quản lý yêu cầu ứng dụng bảo mật hơn với ít programming effort nhất. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Dùng AWS Key Management Service (AWS KMS) tạo keys. Cấu hình ứng dụng nạp database credentials từ AWS KMS. Bật automatic key rotation.',
      B: 'Tạo credentials trên RDS for MySQL cho application user và lưu trong AWS Secrets Manager. Cấu hình ứng dụng nạp credentials từ Secrets Manager. Tạo AWS Lambda function xoay credentials trong Secrets Manager.',
      C: 'Tạo credentials trên RDS for MySQL cho application user và lưu trong AWS Secrets Manager. Cấu hình ứng dụng nạp credentials từ Secrets Manager. Thiết lập rotation schedule cho application user trong RDS for MySQL bằng Secrets Manager.',
      D: 'Tạo credentials trên RDS for MySQL cho application user và lưu trong AWS Systems Manager Parameter Store. Cấu hình ứng dụng nạp credentials từ Parameter Store. Thiết lập rotation schedule cho application user trong RDS for MySQL bằng Parameter Store.',
    },
  },
  340: {
    questionVi:
      'Một công ty media host website trên AWS. Kiến trúc ứng dụng gồm fleet Amazon EC2 instances sau Application Load Balancer (ALB) và database Amazon Aurora. Đội cybersecurity báo ứng dụng dễ bị SQL injection. Công ty nên xử lý thế nào?',
    optionsVi: {
      A: 'Dùng AWS WAF phía trước ALB. Liên kết web ACL phù hợp với AWS WAF.',
      B: 'Tạo ALB listener rule trả lời SQL injection bằng fixed response.',
      C: 'Đăng ký AWS Shield Advanced để tự động chặn mọi SQL injection attempt.',
      D: 'Thiết lập Amazon Inspector để tự động chặn mọi SQL injection attempt.',
    },
  },
  341: {
    questionVi:
      'Một công ty có Amazon S3 data lake được quản trị bởi AWS Lake Formation. Công ty muốn tạo visualization trong Amazon QuickSight bằng cách join dữ liệu data lake với dữ liệu vận hành trong Amazon Aurora MySQL. Công ty muốn column-level authorization để đội marketing chỉ truy cập một tập cột trong database. Giải pháp nào đáp ứng với operational overhead THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon EMR ingest dữ liệu trực tiếp từ database sang QuickSight SPICE engine. Chỉ gồm các cột cần thiết.',
      B: 'Dùng AWS Glue Studio ingest dữ liệu từ database sang S3 data lake. Gắn IAM policy cho QuickSight users để column-level access control. Dùng Amazon S3 làm data source trong QuickSight.',
      C: 'Dùng AWS Glue Elastic Views tạo materialized view cho database trong Amazon S3. Tạo S3 bucket policy column-level access control cho QuickSight users. Dùng Amazon S3 làm data source trong QuickSight.',
      D: 'Dùng Lake Formation blueprint ingest dữ liệu từ database sang S3 data lake. Dùng Lake Formation enforce column-level access control cho QuickSight users. Dùng Amazon Athena làm data source trong QuickSight.',
    },
  },
  342: {
    questionVi:
      'Một công ty xử lý giao dịch có batch job script chạy hàng tuần trên Amazon EC2 instances trong Auto Scaling group. Số giao dịch thay đổi nhưng CPU utilization baseline mỗi lần chạy ít nhất 60%. Công ty cần provision capacity 30 phút trước khi job chạy. Hiện engineers sửa thủ công tham số Auto Scaling group. Công ty không có nguồn lực phân tích xu hướng capacity. Công ty cần cách tự động sửa desired capacity của Auto Scaling group. Giải pháp nào đáp ứng với operational overhead THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo dynamic scaling policy cho Auto Scaling group. Cấu hình policy scale theo CPU utilization metric. Đặt target value 60%.',
      B: 'Tạo scheduled scaling policy cho Auto Scaling group. Đặt desired capacity, minimum capacity và maximum capacity phù hợp. Đặt recurrence hàng tuần. Đặt start time 30 phút trước khi batch jobs chạy.',
      C: 'Tạo predictive scaling policy cho Auto Scaling group. Cấu hình policy scale theo forecast. Đặt scaling metric là CPU utilization với target 60%. Trong policy, pre-launch instances 30 phút trước khi jobs chạy.',
      D: 'Tạo Amazon EventBridge event gọi AWS Lambda khi CPU utilization của Auto Scaling group đạt 60%. Cấu hình Lambda tăng desired capacity và maximum capacity thêm 20%.',
    },
  },
  343: {
    questionVi:
      'Kiến trúc sư giải pháp thiết kế DR architecture cho công ty. Công ty có MySQL database chạy trên Amazon EC2 instance trong private subnet với scheduled backup. DR design cần gồm nhiều AWS Regions. Giải pháp nào đáp ứng với operational overhead THẤP NHẤT?',
    optionsVi: {
      A: 'Di chuyển MySQL database sang nhiều EC2 instances. Cấu hình standby EC2 instance ở DR Region. Bật replication.',
      B: 'Di chuyển MySQL database sang Amazon RDS. Dùng Multi-AZ deployment. Bật read replication cho primary DB instance ở các Availability Zone khác nhau.',
      C: 'Di chuyển MySQL database sang Amazon Aurora global database. Host primary DB cluster ở Region chính. Host secondary DB cluster ở DR Region.',
      D: 'Lưu scheduled backup MySQL database trong Amazon S3 bucket cấu hình S3 Cross-Region Replication (CRR). Dùng data backup restore database ở DR Region.',
    },
  },
  344: {
    questionVi:
      'Một công ty có ứng dụng Java dùng Amazon Simple Queue Service (Amazon SQS) parse messages. Ứng dụng không parse được message lớn hơn 256 KB. Công ty muốn parse message tới 50 MB. Giải pháp nào đáp ứng với ÍT thay đổi code nhất?',
    optionsVi: {
      A: 'Dùng Amazon SQS Extended Client Library for Java host message lớn hơn 256 KB trong Amazon S3.',
      B: 'Dùng Amazon EventBridge đăng large messages từ ứng dụng thay vì Amazon SQS.',
      C: 'Thay đổi giới hạn trong Amazon SQS để xử lý message lớn hơn 256 KB.',
      D: 'Lưu message lớn hơn 256 KB trong Amazon Elastic File System (Amazon EFS). Cấu hình Amazon SQS tham chiếu vị trí này trong messages.',
    },
  },
  345: {
    questionVi:
      'Một công ty muốn hạn chế truy cập nội dung của một web application chính và bảo vệ nội dung bằng authorization techniques trên AWS. Công ty muốn serverless architecture và authentication cho dưới 100 users. Giải pháp cần tích hợp web application chính và phục vụ web content globally. Giải pháp phải scale khi user base tăng đồng thời login latency thấp nhất. Giải pháp nào HIỆU QUẢ CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon Cognito cho authentication. Dùng Lambda@Edge cho authorization. Dùng Amazon CloudFront phục vụ web application globally.',
      B: 'Dùng AWS Directory Service for Microsoft Active Directory cho authentication. Dùng AWS Lambda cho authorization. Dùng Application Load Balancer phục vụ web application globally.',
      C: 'Dùng Amazon Cognito cho authentication. Dùng AWS Lambda cho authorization. Dùng Amazon S3 Transfer Acceleration phục vụ web application globally.',
      D: 'Dùng AWS Directory Service for Microsoft Active Directory cho authentication. Dùng Lambda@Edge cho authorization. Dùng AWS Elastic Beanstalk phục vụ web application globally.',
    },
  },
  346: {
    questionVi:
      'Một công ty có NAS array cũ trong data center. NAS array expose SMB shares và NFS shares cho client workstations. Công ty không muốn mua NAS mới hoặc gia hạn support contract. Một phần dữ liệu truy cập thường xuyên, phần lớn inactive. Kiến trúc sư giải pháp cần migrate dữ liệu lên Amazon S3, dùng S3 Lifecycle policies và giữ look-and-feel cho client workstations. Kiến trúc sư đã xác định AWS Storage Gateway là một phần giải pháp. Nên cấp phát loại storage gateway nào?',
    optionsVi: {
      A: 'Volume Gateway',
      B: 'Tape Gateway',
      C: 'Amazon FSx File Gateway',
      D: 'Amazon S3 File Gateway',
    },
  },
  347: {
    questionVi:
      'Một công ty có ứng dụng chạy trên Amazon EC2 instances. Kiến trúc sư giải pháp đã chuẩn hóa instance family và các instance sizes theo nhu cầu hiện tại. Công ty muốn tối đa cost savings cho ứng dụng trong 3 năm tới. Công ty phải có thể đổi instance family và sizes trong 6 tháng tới theo độ phổ biến và usage. Giải pháp nào HIỆU QUẢ CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Compute Savings Plan',
      B: 'EC2 Instance Savings Plan',
      C: 'Zonal Reserved Instances',
      D: 'Standard Reserved Instances',
    },
  },
  348: {
    questionVi:
      'Một công ty thu thập dữ liệu từ số lượng lớn người tham gia dùng wearable devices. Dữ liệu lưu trong bảng Amazon DynamoDB và ứng dụng phân tích dữ liệu. Workload ổn định và dự đoán được. Công ty muốn ở hoặc dưới ngân sách DynamoDB đã forecast. Giải pháp nào HIỆU QUẢ CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng provisioned mode và DynamoDB Standard-Infrequent Access (DynamoDB Standard-IA). Reserve capacity cho workload đã forecast.',
      B: 'Dùng provisioned mode. Chỉ định read capacity units (RCUs) và write capacity units (WCUs).',
      C: 'Dùng on-demand mode. Đặt RCUs và WCUs đủ cao cho thay đổi workload.',
      D: 'Dùng on-demand mode. Chỉ định RCUs và WCUs với reserved capacity.',
    },
  },
  349: {
    questionVi:
      'Một công ty lưu dữ liệu bí mật trong Amazon Aurora PostgreSQL database ở Region ap-southeast-3. Database được mã hóa bằng AWS KMS customer managed key. Công ty vừa được mua lại và phải chia sẻ backup database an toàn với AWS account công ty mua ở cùng Region. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Tạo database snapshot. Copy snapshot sang snapshot mới không mã hóa. Chia sẻ snapshot mới với AWS account công ty mua.',
      B: 'Tạo database snapshot. Thêm AWS account công ty mua vào KMS key policy. Chia sẻ snapshot với AWS account công ty mua.',
      C: 'Tạo database snapshot dùng AWS managed KMS key khác. Thêm AWS account công ty mua vào KMS key alias. Chia sẻ snapshot với AWS account công ty mua.',
      D: 'Tạo database snapshot. Tải snapshot xuống. Upload snapshot lên Amazon S3 bucket. Cập nhật S3 bucket policy cho phép truy cập từ AWS account công ty mua.',
    },
  },
  350: {
    questionVi:
      'Một công ty dùng Amazon RDS for Microsoft SQL Server Single-AZ DB instance 100 GB ở Region us-east-1 lưu giao dịch khách hàng. Công ty cần high availability và automatic recovery cho DB instance. Công ty cũng chạy reports trên RDS database vài lần mỗi năm. Quy trình report làm transactions post chậm hơn bình thường. Công ty cần giải pháp cải thiện hiệu năng report. Nên kết hợp bước nào? (Chọn hai.)',
    optionsVi: {
      A: 'Sửa DB instance từ Single-AZ sang Multi-AZ deployment.',
      B: 'Chụp snapshot DB instance hiện tại. Restore snapshot sang RDS deployment mới ở Availability Zone khác.',
      C: 'Tạo read replica DB instance ở Availability Zone khác. Chuyển mọi request reports sang read replica.',
      D: 'Migrate database sang RDS Custom.',
      E: 'Dùng RDS Proxy giới hạn reporting requests trong maintenance window.',
    },
  },
  351: {
    questionVi:
      'Một công ty đang chuyển ứng dụng quản lý dữ liệu lên AWS. Công ty muốn chuyển sang event-driven architecture phân tán hơn, dùng serverless concepts khi thực hiện các bước workflow. Công ty cũng muốn tối thiểu operational overhead. Giải pháp nào đáp ứng?',
    optionsVi: {
      A: 'Xây workflow trong AWS Glue. Dùng AWS Glue gọi AWS Lambda functions xử lý các bước workflow.',
      B: 'Xây workflow trong AWS Step Functions. Triển khai ứng dụng trên Amazon EC2 instances. Dùng Step Functions gọi các bước workflow trên EC2 instances.',
      C: 'Xây workflow trong Amazon EventBridge. Dùng EventBridge gọi AWS Lambda functions theo lịch xử lý các bước workflow.',
      D: 'Xây workflow trong AWS Step Functions. Dùng Step Functions tạo state machine. Dùng state machine gọi AWS Lambda functions xử lý các bước workflow.',
    },
  },
  352: {
    questionVi:
      'Một công ty thiết kế mạng cho game online multiplayer. Game dùng giao thức UDP và triển khai ở tám AWS Regions. Kiến trúc mạng cần tối thiểu latency và packet loss cho trải nghiệm chơi chất lượng cao. Giải pháp nào đáp ứng?',
    optionsVi: {
      A: 'Thiết lập transit gateway ở mỗi Region. Tạo inter-Region peering attachments giữa các transit gateway.',
      B: 'Thiết lập AWS Global Accelerator với UDP listeners và endpoint groups ở mỗi Region.',
      C: 'Thiết lập Amazon CloudFront bật UDP. Cấu hình origin ở mỗi Region.',
      D: 'Thiết lập VPC peering mesh giữa mỗi Region. Bật UDP cho mỗi VPC.',
    },
  },
  353: {
    questionVi:
      'Một công ty host three-tier web application trên Amazon EC2 instances trong một Availability Zone. Web application dùng self-managed MySQL database trên EC2 instance lưu dữ liệu trong Amazon EBS volume 1 TB Provisioned IOPS SSD (io2). Database cần 1000 IOPS read và write ở peak traffic. Công ty muốn giảm gián đoạn, ổn định hiệu năng, giảm chi phí nhưng giữ capacity gấp đôi IOPS. Công ty muốn chuyển database tier sang fully managed, highly available và fault tolerant. Giải pháp nào HIỆU QUẢ CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng Multi-AZ deployment Amazon RDS for MySQL DB instance với io2 Block Express EBS volume.',
      B: 'Dùng Multi-AZ deployment Amazon RDS for MySQL DB instance với General Purpose SSD (gp2) EBS volume.',
      C: 'Dùng Amazon S3 Intelligent-Tiering access tiers.',
      D: 'Dùng hai EC2 instances lớn host database ở chế độ active-passive.',
    },
  },
  354: {
    questionVi:
      'Một công ty host serverless application trên AWS. Ứng dụng dùng Amazon API Gateway, AWS Lambda và Amazon RDS for PostgreSQL. Công ty thấy lỗi ứng dụng tăng do database connection timeouts khi peak traffic hoặc traffic không dự đoán được. Công ty cần giải pháp giảm application failures với ít thay đổi code nhất. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Giảm Lambda concurrency rate.',
      B: 'Bật RDS Proxy trên RDS DB instance.',
      C: 'Resize RDS DB instance class để chấp nhận thêm connections.',
      D: 'Migrate database sang Amazon DynamoDB với on-demand scaling.',
    },
  },
  355: {
    questionVi:
      'Một công ty đang migrate ứng dụng cũ lên AWS. Ứng dụng chạy batch job mỗi giờ và CPU intensive. Batch job mất trung bình 15 phút trên server on-premises có 64 vCPU và 512 GiB memory. Giải pháp nào chạy batch job trong 15 phút với operational overhead THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Lambda với functional scaling.',
      B: 'Dùng Amazon Elastic Container Service (Amazon ECS) với AWS Fargate.',
      C: 'Dùng Amazon Lightsail với AWS Auto Scaling.',
      D: 'Dùng AWS Batch trên Amazon EC2.',
    },
  },
  356: {
    questionVi:
      'Một công ty lưu data objects trong Amazon S3 Standard storage. Kiến trúc sư giải pháp phát hiện 75% dữ liệu ít được truy cập sau 30 ngày. Công ty cần mọi dữ liệu vẫn truy cập ngay với high availability và resiliency như cũ, nhưng muốn tối thiểu storage costs. Giải pháp storage nào đáp ứng?',
    optionsVi: {
      A: 'Chuyển data objects sang S3 Glacier Deep Archive sau 30 ngày.',
      B: 'Chuyển data objects sang S3 Standard-Infrequent Access (S3 Standard-IA) sau 30 ngày.',
      C: 'Chuyển data objects sang S3 One Zone-Infrequent Access (S3 One Zone-IA) sau 30 ngày.',
      D: 'Chuyển data objects sang S3 One Zone-Infrequent Access (S3 One Zone-IA) ngay lập tức.',
    },
  },
  357: {
    questionVi:
      'Một công ty game chuyển public scoreboard từ data center lên AWS Cloud. Công ty dùng Amazon EC2 Windows Server instances sau Application Load Balancer host dynamic application. Công ty cần highly available storage cho ứng dụng gồm static files và dynamic server-side code. Nên kết hợp bước nào? (Chọn hai.)',
    optionsVi: {
      A: 'Lưu static files trên Amazon S3. Dùng Amazon CloudFront cache objects ở edge.',
      B: 'Lưu static files trên Amazon S3. Dùng Amazon ElastiCache cache objects ở edge.',
      C: 'Lưu server-side code trên Amazon Elastic File System (Amazon EFS). Mount EFS volume trên mỗi EC2 instance để chia sẻ files.',
      D: 'Lưu server-side code trên Amazon FSx for Windows File Server. Mount FSx for Windows File Server volume trên mỗi EC2 instance để chia sẻ files.',
      E: 'Lưu server-side code trên General Purpose SSD (gp2) Amazon EBS volume. Mount EBS volume trên mỗi EC2 instance để chia sẻ files.',
    },
  },
  358: {
    questionVi:
      'Một công ty social media chạy ứng dụng trên Amazon EC2 instances sau Application Load Balancer (ALB). ALB là origin cho Amazon CloudFront distribution. Ứng dụng có hơn một tỷ ảnh trong Amazon S3 bucket và xử lý hàng nghìn ảnh mỗi giây. Công ty muốn resize ảnh động và phục vụ format phù hợp cho clients. Giải pháp nào đáp ứng với operational overhead THẤP NHẤT?',
    optionsVi: {
      A: 'Cài external image management library trên EC2 instance. Dùng library xử lý ảnh.',
      B: 'Tạo CloudFront origin request policy. Dùng policy tự động resize ảnh và phục vụ format phù hợp theo User-Agent HTTP header trong request.',
      C: 'Dùng Lambda@Edge function với external image management library. Liên kết Lambda@Edge function với CloudFront behaviors phục vụ ảnh.',
      D: 'Tạo CloudFront response headers policy. Dùng policy tự động resize ảnh và phục vụ format phù hợp theo User-Agent HTTP header trong request.',
    },
  },
  359: {
    questionVi:
      'Một bệnh viện cần lưu hồ sơ bệnh nhân trong Amazon S3 bucket. Đội compliance phải đảm bảo mọi protected health information (PHI) được mã hóa in transit và at rest. Đội compliance phải quản trị encryption key cho data at rest. Giải pháp nào đáp ứng?',
    optionsVi: {
      A: 'Tạo public SSL/TLS certificate trong AWS Certificate Manager (ACM). Liên kết certificate với Amazon S3. Cấu hình default encryption mỗi S3 bucket dùng server-side encryption với AWS KMS keys (SSE-KMS). Giao compliance team quản lý KMS keys.',
      B: 'Dùng điều kiện aws:SecureTransport trên S3 bucket policies chỉ cho phép kết nối mã hóa qua HTTPS (TLS). Cấu hình default encryption mỗi S3 bucket dùng SSE-S3. Giao compliance team quản lý SSE-S3 keys.',
      C: 'Dùng điều kiện aws:SecureTransport trên S3 bucket policies chỉ cho phép kết nối mã hóa qua HTTPS (TLS). Cấu hình default encryption mỗi S3 bucket dùng SSE-KMS. Giao compliance team quản lý KMS keys.',
      D: 'Dùng điều kiện aws:SecureTransport trên S3 bucket policies chỉ cho phép kết nối mã hóa qua HTTPS (TLS). Dùng Amazon Macie bảo vệ sensitive data trong Amazon S3. Giao compliance team quản lý Macie.',
    },
  },
  360: {
    questionVi:
      'Một công ty dùng Amazon API Gateway chạy private gateway với hai REST APIs trong cùng VPC. BuyStock RESTful web service gọi CheckFunds RESTful web service để đảm bảo đủ tiền trước khi mua cổ phiếu. VPC flow logs cho thấy BuyStock gọi CheckFunds qua internet thay vì qua VPC. Kiến trúc sư giải pháp phải để APIs giao tiếp qua VPC. Giải pháp nào đáp ứng với ÍT thay đổi code nhất?',
    optionsVi: {
      A: 'Thêm header X-API-Key trong HTTP header cho authorization.',
      B: 'Dùng interface endpoint.',
      C: 'Dùng gateway endpoint.',
      D: 'Thêm Amazon Simple Queue Service (Amazon SQS) queue giữa hai REST APIs.',
    },
  },
  361: {
    questionVi:
      'Một công ty host ứng dụng gaming multiplayer trên AWS. Công ty muốn ứng dụng đọc dữ liệu với sub-millisecond latency và chạy one-time queries trên historical data. Giải pháp nào đáp ứng với operational overhead THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon RDS cho dữ liệu truy cập thường xuyên. Chạy periodic custom script export dữ liệu sang Amazon S3 bucket.',
      B: 'Lưu dữ liệu trực tiếp trong Amazon S3 bucket. Triển khai S3 Lifecycle policy chuyển dữ liệu cũ sang S3 Glacier Deep Archive. Chạy one-time queries bằng Amazon Athena.',
      C: 'Dùng Amazon DynamoDB với DynamoDB Accelerator (DAX) cho dữ liệu truy cập thường xuyên. Export dữ liệu sang Amazon S3 bucket bằng DynamoDB table export. Chạy one-time queries bằng Amazon Athena.',
      D: 'Dùng Amazon DynamoDB cho dữ liệu truy cập thường xuyên. Bật streaming sang Amazon Kinesis Data Streams. Dùng Amazon Kinesis Data Firehose đọc dữ liệu từ Kinesis Data Streams. Lưu records trong Amazon S3 bucket.',
    },
  },
};

const out = writeBatch(13, 337, 361, T);
console.log('Wrote', out);
