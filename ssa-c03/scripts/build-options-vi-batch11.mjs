#!/usr/bin/env node
import { writeBatch } from './build-options-vi-batches.mjs';

const T = {
  287: {
    questionVi:
      'Một công ty muốn migrate ứng dụng Windows từ on-premises lên AWS Cloud. Ứng dụng có ba tầng: application tier, business tier và database tier với Microsoft SQL Server. Công ty muốn dùng các tính năng cụ thể của SQL Server như native backups và Data Quality Services. Công ty cũng cần chia sẻ tệp xử lý giữa các tầng. Kiến trúc sư giải pháp nên thiết kế kiến trúc như thế nào?',
    optionsVi: {
      A: 'Host cả ba tầng trên Amazon EC2 instances. Dùng Amazon FSx File Gateway chia sẻ tệp giữa các tầng.',
      B: 'Host cả ba tầng trên Amazon EC2 instances. Dùng Amazon FSx for Windows File Server chia sẻ tệp giữa các tầng.',
      C: 'Host application tier và business tier trên Amazon EC2 instances. Host database tier trên Amazon RDS. Dùng Amazon Elastic File System (Amazon EFS) chia sẻ tệp giữa các tầng.',
      D: 'Host application tier và business tier trên Amazon EC2 instances. Host database tier trên Amazon RDS. Dùng Provisioned IOPS SSD (io2) Amazon Elastic Block Store (Amazon EBS) volume chia sẻ tệp giữa các tầng.',
    },
  },
  288: {
    questionVi:
      'Một công ty đang migrate nhóm web server Linux lên AWS. Web servers phải truy cập tệp trong shared file store cho một số nội dung. Công ty không được thay đổi ứng dụng. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Tạo Amazon S3 Standard bucket cho phép web servers truy cập.',
      B: 'Cấu hình Amazon CloudFront distribution với Amazon S3 bucket làm origin.',
      C: 'Tạo Amazon Elastic File System (Amazon EFS) file system. Mount EFS file system trên tất cả web servers.',
      D: 'Cấu hình General Purpose SSD (gp3) Amazon Elastic Block Store (Amazon EBS) volume. Mount EBS volume trên tất cả web servers.',
    },
  },
  289: {
    questionVi:
      'Một công ty có AWS Lambda function cần quyền read tới Amazon S3 bucket trong cùng tài khoản AWS. Giải pháp nào đáp ứng theo cách BẢO MẬT NHẤT?',
    optionsVi: {
      A: 'Áp dụng S3 bucket policy cấp read access cho S3 bucket.',
      B: 'Gắn IAM role cho Lambda function. Áp dụng IAM policy cho role cấp read access cho S3 bucket.',
      C: 'Nhúng access key và secret key trong code Lambda function để cấp IAM permissions read access cho S3 bucket.',
      D: 'Gắn IAM role cho Lambda function. Áp dụng IAM policy cho role cấp read access cho tất cả S3 buckets trong tài khoản.',
    },
  },
  290: {
    questionVi:
      'Một công ty host ứng dụng web trên nhiều Amazon EC2 instances. EC2 instances nằm trong Auto Scaling group scale theo nhu cầu người dùng. Công ty muốn tối ưu tiết kiệm chi phí mà không cam kết dài hạn. Kiến trúc sư giải pháp nên đề xuất tùy chọn mua EC2 instance nào?',
    optionsVi: {
      A: 'Chỉ Dedicated Instances',
      B: 'Chỉ On-Demand Instances',
      C: 'Kết hợp On-Demand Instances và Spot Instances',
      D: 'Kết hợp On-Demand Instances và Reserved Instances',
    },
  },
  291: {
    questionVi:
      'Một công ty media dùng Amazon CloudFront cho nội dung video streaming công khai. Công ty muốn bảo mật nội dung video host trong Amazon S3 bằng cách kiểm soát ai được truy cập. Một số người dùng dùng HTTP client tùy chỉnh không hỗ trợ cookies. Một số người dùng không thể thay đổi URL hardcoded đang dùng. Dịch vụ hoặc phương thức nào đáp ứng với TÁC ĐỘNG ÍT NHẤT tới người dùng? (Chọn hai.)',
    optionsVi: {
      A: 'Signed cookies',
      B: 'Signed URLs',
      C: 'AWS AppSync',
      D: 'JSON Web Token (JWT)',
      E: 'AWS Secrets Manager',
    },
  },
  292: {
    questionVi:
      'Một công ty chuẩn bị nền tảng dữ liệu mới thu nhận dữ liệu streaming thời gian thực từ nhiều nguồn. Công ty cần chuyển đổi dữ liệu trước khi ghi vào Amazon S3. Công ty cần khả năng dùng SQL truy vấn dữ liệu đã chuyển đổi. Giải pháp nào đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Dùng Amazon Kinesis Data Streams stream dữ liệu. Dùng Amazon Kinesis Data Analytics chuyển đổi dữ liệu. Dùng Amazon Kinesis Data Firehose ghi dữ liệu vào Amazon S3. Dùng Amazon Athena truy vấn dữ liệu đã chuyển đổi từ Amazon S3.',
      B: 'Dùng Amazon Managed Streaming for Apache Kafka (Amazon MSK) stream dữ liệu. Dùng AWS Glue chuyển đổi dữ liệu và ghi vào Amazon S3. Dùng Amazon Athena truy vấn dữ liệu đã chuyển đổi từ Amazon S3.',
      C: 'Dùng AWS Database Migration Service (AWS DMS) ingest dữ liệu. Dùng Amazon EMR chuyển đổi dữ liệu và ghi vào Amazon S3. Dùng Amazon Athena truy vấn dữ liệu đã chuyển đổi từ Amazon S3.',
      D: 'Dùng Amazon MSK stream dữ liệu. Dùng Amazon Kinesis Data Analytics chuyển đổi dữ liệu và ghi vào Amazon S3. Dùng Amazon RDS query editor truy vấn dữ liệu đã chuyển đổi từ Amazon S3.',
      E: 'Dùng Amazon Kinesis Data Streams stream dữ liệu. Dùng AWS Glue chuyển đổi dữ liệu. Dùng Amazon Kinesis Data Firehose ghi dữ liệu vào Amazon S3. Dùng Amazon RDS query editor truy vấn dữ liệu đã chuyển đổi từ Amazon S3.',
    },
  },
  293: {
    questionVi:
      'Một công ty có giải pháp backup volume on-premises đã hết vòng đời. Công ty muốn dùng AWS trong giải pháp backup mới và duy trì truy cập local tới toàn bộ dữ liệu khi backup trên AWS. Công ty muốn đảm bảo dữ liệu backup trên AWS được chuyển tự động và an toàn. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng AWS Snowball migrate dữ liệu ra khỏi giải pháp on-premises lên Amazon S3. Cấu hình hệ thống on-premises mount Snowball S3 endpoint cung cấp truy cập local.',
      B: 'Dùng AWS Snowball Edge migrate dữ liệu ra khỏi giải pháp on-premises lên Amazon S3. Dùng Snowball Edge file interface cung cấp cho hệ thống on-premises truy cập local.',
      C: 'Dùng AWS Storage Gateway và cấu hình cached volume gateway. Chạy Storage Gateway software appliance on-premises và cấu hình phần trăm dữ liệu cache local. Mount gateway storage volumes cung cấp truy cập local.',
      D: 'Dùng AWS Storage Gateway và cấu hình stored volume gateway. Chạy Storage Gateway software appliance on-premises và map gateway storage volumes tới lưu trữ on-premises. Mount gateway storage volumes cung cấp truy cập local.',
    },
  },
  294: {
    questionVi:
      'Ứng dụng host trên Amazon EC2 instances cần truy cập Amazon S3 bucket. Traffic không được đi qua internet. Kiến trúc sư giải pháp nên cấu hình truy cập như thế nào?',
    optionsVi: {
      A: 'Tạo private hosted zone bằng Amazon Route 53.',
      B: 'Thiết lập gateway VPC endpoint cho Amazon S3 trong VPC.',
      C: 'Cấu hình EC2 instances dùng NAT gateway truy cập S3 bucket.',
      D: 'Thiết lập kết nối AWS Site-to-Site VPN giữa VPC và S3 bucket.',
    },
  },
  295: {
    questionVi:
      'Một công ty thương mại điện tử lưu hàng terabyte dữ liệu khách hàng trên AWS Cloud. Dữ liệu chứa personally identifiable information (PII). Công ty muốn dùng dữ liệu trong ba ứng dụng. Chỉ một ứng dụng cần xử lý PII. PII phải được loại bỏ trước khi hai ứng dụng còn lại xử lý dữ liệu. Giải pháp nào đáp ứng với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Lưu dữ liệu trong bảng Amazon DynamoDB. Tạo proxy application layer chặn và xử lý dữ liệu mỗi ứng dụng yêu cầu.',
      B: 'Lưu dữ liệu trong Amazon S3 bucket. Xử lý và chuyển đổi dữ liệu bằng S3 Object Lambda trước khi trả dữ liệu cho ứng dụng yêu cầu.',
      C: 'Xử lý dữ liệu và lưu dữ liệu đã chuyển đổi trong ba Amazon S3 buckets riêng để mỗi ứng dụng có dataset riêng. Trỏ mỗi ứng dụng tới S3 bucket tương ứng.',
      D: 'Xử lý dữ liệu và lưu dữ liệu đã chuyển đổi trong ba bảng Amazon DynamoDB riêng để mỗi ứng dụng có dataset riêng. Trỏ mỗi ứng dụng tới bảng DynamoDB tương ứng.',
    },
  },
  296: {
    questionVi:
      'Đội phát triển ra mắt ứng dụng mới host trên Amazon EC2 instances trong development VPC. Kiến trúc sư giải pháp cần tạo VPC mới trong cùng tài khoản. VPC mới sẽ được peer với development VPC. VPC CIDR block của development VPC là 192.168.0.0/24. Kiến trúc sư giải pháp cần tạo CIDR block cho VPC mới, hợp lệ cho VPC peering connection tới development VPC. CIDR block NHỎ NHẤT đáp ứng các yêu cầu này là gì?',
    optionsVi: {
      A: '10.0.1.0/32',
      B: '192.168.0.0/24',
      C: '192.168.1.0/32',
      D: '10.0.1.0/24',
    },
  },
  297: {
    questionVi:
      'Một công ty triển khai ứng dụng trên năm Amazon EC2 instances. Application Load Balancer (ALB) phân phối traffic tới instances qua target group. CPU usage trung bình trên mỗi instance dưới 10% hầu hết thời gian, thỉnh thoảng tăng đột biến tới 65%. Kiến trúc sư giải pháp cần tự động hóa khả năng mở rộng ứng dụng, tối ưu chi phí kiến trúc và đảm bảo ứng dụng có đủ tài nguyên CPU khi tăng đột biến. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo Amazon CloudWatch alarm chuyển sang ALARM state khi metric CPUUtilization dưới 20%. Tạo AWS Lambda function CloudWatch alarm gọi để terminate một EC2 instance trong ALB target group.',
      B: 'Tạo EC2 Auto Scaling group. Chọn ALB hiện có làm load balancer và target group hiện có làm target group. Đặt target tracking scaling policy dựa trên metric ASGAverageCPUUtilization. Đặt minimum instances là 2, desired capacity là 3, maximum instances là 6 và target value là 50%. Thêm EC2 instances vào Auto Scaling group.',
      C: 'Tạo EC2 Auto Scaling group. Chọn ALB hiện có làm load balancer và target group hiện có làm target group. Đặt minimum instances là 2, desired capacity là 3 và maximum instances là 6. Thêm EC2 instances vào Auto Scaling group.',
      D: 'Tạo hai Amazon CloudWatch alarms. Cấu hình alarm đầu chuyển sang ALARM state khi average CPUUtilization metric dưới 20%. Cấu hình alarm thứ hai chuyển sang ALARM state khi average CPUUtilization metric trên 50%. Cấu hình alarms publish tới Amazon Simple Notification Service (Amazon SNS) topic gửi email. Sau khi nhận message, đăng nhập giảm hoặc tăng số EC2 instances đang chạy.',
    },
  },
  298: {
    questionVi:
      'Một công ty chạy ứng dụng kinh doanh quan trọng trên Amazon EC2 instances phía sau Application Load Balancer. EC2 instances chạy trong Auto Scaling group và truy cập Amazon RDS DB instance. Thiết kế không vượt qua operational review vì EC2 instances và DB instance đều nằm trong một Availability Zone. Kiến trúc sư giải pháp phải cập nhật thiết kế dùng Availability Zone thứ hai. Giải pháp nào làm ứng dụng có tính sẵn sàng cao?',
    optionsVi: {
      A: 'Cấp phát subnet trong từng Availability Zone. Cấu hình Auto Scaling group phân phối EC2 instances trên cả hai Availability Zones. Cấu hình DB instance kết nối tới từng network.',
      B: 'Cấp phát hai subnets trải trên cả hai Availability Zones. Cấu hình Auto Scaling group phân phối EC2 instances trên cả hai Availability Zones. Cấu hình DB instance kết nối tới từng network.',
      C: 'Cấp phát subnet trong từng Availability Zone. Cấu hình Auto Scaling group phân phối EC2 instances trên cả hai Availability Zones. Cấu hình DB instance triển khai Multi-AZ.',
      D: 'Cấp phát subnet trải trên cả hai Availability Zones. Cấu hình Auto Scaling group phân phối EC2 instances trên cả hai Availability Zones. Cấu hình DB instance triển khai Multi-AZ.',
    },
  },
  299: {
    questionVi:
      'Một phòng thí nghiệm nghiên cứu cần xử lý khoảng 8 TB dữ liệu. Phòng thí nghiệm yêu cầu độ trễ dưới millisecond và throughput tối thiểu 6 GBps cho storage subsystem. Hàng trăm Amazon EC2 instances chạy Amazon Linux sẽ phân phối và xử lý dữ liệu. Giải pháp nào đáp ứng yêu cầu hiệu năng?',
    optionsVi: {
      A: 'Tạo Amazon FSx for NetApp ONTAP file system. Đặt tiering policy của mỗi volume là ALL. Import raw data vào file system. Mount file system trên EC2 instances.',
      B: 'Tạo Amazon S3 bucket lưu raw data. Tạo Amazon FSx for Lustre file system dùng persistent SSD storage. Chọn tùy chọn import data from và export data to Amazon S3. Mount file system trên EC2 instances.',
      C: 'Tạo Amazon S3 bucket lưu raw data. Tạo Amazon FSx for Lustre file system dùng persistent HDD storage. Chọn tùy chọn import data from và export data to Amazon S3. Mount file system trên EC2 instances.',
      D: 'Tạo Amazon FSx for NetApp ONTAP file system. Đặt tiering policy của mỗi volume là NONE. Import raw data vào file system. Mount file system trên EC2 instances.',
    },
  },
  300: {
    questionVi:
      'Một công ty cần migrate ứng dụng legacy từ data center on-premises lên AWS Cloud vì giới hạn dung lượng phần cứng. Ứng dụng chạy 24 giờ mỗi ngày, 7 ngày mỗi tuần. Database storage của ứng dụng tiếp tục tăng theo thời gian. Kiến trúc sư giải pháp nên làm gì để đáp ứng TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Migrate application layer sang Amazon EC2 Spot Instances. Migrate data storage layer sang Amazon S3.',
      B: 'Migrate application layer sang Amazon EC2 Reserved Instances. Migrate data storage layer sang Amazon RDS On-Demand Instances.',
      C: 'Migrate application layer sang Amazon EC2 Reserved Instances. Migrate data storage layer sang Amazon Aurora Reserved Instances.',
      D: 'Migrate application layer sang Amazon EC2 On-Demand Instances. Migrate data storage layer sang Amazon RDS Reserved Instances.',
    },
  },
  301: {
    questionVi:
      'Một phòng thí nghiệm nghiên cứu đại học cần migrate 30 TB dữ liệu từ Windows file server on-premises lên Amazon FSx for Windows File Server. Phòng thí nghiệm có liên kết mạng 1 Gbps mà nhiều khoa khác trong đại học cùng dùng. Phòng thí nghiệm muốn triển khai dịch vụ migration dữ liệu tối đa hóa hiệu năng chuyển dữ liệu, nhưng cần kiểm soát lượng băng thông dịch vụ sử dụng để giảm tác động tới các khoa khác. Migration phải hoàn tất trong 5 ngày tới. Giải pháp AWS nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'AWS Snowcone',
      B: 'Amazon FSx File Gateway',
      C: 'AWS DataSync',
      D: 'AWS Transfer Family',
    },
  },
  302: {
    questionVi:
      'Một công ty muốn tạo ứng dụng di động cho phép người dùng stream video clip slow-motion trên thiết bị di động. Hiện tại, ứng dụng quay video clip và upload clip ở định dạng raw vào Amazon S3 bucket. Ứng dụng lấy video clip trực tiếp từ S3 bucket. Tuy nhiên, video ở định dạng raw rất lớn. Người dùng gặp vấn đề buffering và playback trên thiết bị di động. Công ty muốn triển khai giải pháp tối đa hóa hiệu năng và khả năng mở rộng đồng thời giảm chi phí vận hành. Kiến trúc sư giải pháp nên kết hợp giải pháp nào? (Chọn hai.)',
    optionsVi: {
      A: 'Triển khai Amazon CloudFront cho content delivery và caching.',
      B: 'Dùng AWS DataSync replicate tệp video qua các AWS Regions trong S3 buckets khác.',
      C: 'Dùng Amazon Elastic Transcoder chuyển tệp video sang định dạng phù hợp hơn.',
      D: 'Triển khai Auto Scaling group gồm Amazon EC2 instances trong Local Zones cho content delivery và caching.',
      E: 'Triển khai Auto Scaling group gồm Amazon EC2 instances chuyển tệp video sang định dạng phù hợp hơn.',
    },
  },
  303: {
    questionVi:
      'Một công ty ra mắt ứng dụng mới triển khai trên Amazon Elastic Container Service (Amazon ECS) cluster và dùng Fargate launch type cho ECS tasks. Công ty giám sát CPU và memory usage vì dự kiến traffic cao khi ra mắt. Tuy nhiên, công ty muốn giảm chi phí khi utilization giảm. Kiến trúc sư giải pháp nên đề xuất gì?',
    optionsVi: {
      A: 'Dùng Amazon EC2 Auto Scaling scale theo khoảng thời gian dựa trên traffic patterns trước đó.',
      B: 'Dùng AWS Lambda function scale Amazon ECS khi metric breaches kích hoạt Amazon CloudWatch alarm.',
      C: 'Dùng Amazon EC2 Auto Scaling với simple scaling policies scale khi ECS metric breaches kích hoạt Amazon CloudWatch alarm.',
      D: 'Dùng AWS Application Auto Scaling với target tracking policies scale khi ECS metric breaches kích hoạt Amazon CloudWatch alarm.',
    },
  },
  304: {
    questionVi:
      'Một công ty gần đây tạo disaster recovery site ở AWS Region khác. Công ty cần chuyển lượng lớn dữ liệu qua lại giữa NFS file systems ở hai Regions định kỳ. Giải pháp nào đáp ứng với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng AWS DataSync.',
      B: 'Dùng AWS Snowball devices.',
      C: 'Thiết lập SFTP server trên Amazon EC2.',
      D: 'Dùng AWS Database Migration Service (AWS DMS).',
    },
  },
  305: {
    questionVi:
      'Một công ty thiết kế giải pháp lưu trữ dùng chung cho ứng dụng gaming host trên AWS Cloud. Công ty cần khả năng dùng SMB clients truy cập dữ liệu. Giải pháp phải được quản lý hoàn toàn. Giải pháp AWS nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo AWS DataSync task chia sẻ dữ liệu dạng mountable file system. Mount file system lên application server.',
      B: 'Tạo Amazon EC2 Windows instance. Cài và cấu hình vai trò Windows file share trên instance. Kết nối application server với file share.',
      C: 'Tạo Amazon FSx for Windows File Server file system. Gắn file system vào origin server. Kết nối application server với file system.',
      D: 'Tạo Amazon S3 bucket. Gán IAM role cho ứng dụng cấp quyền truy cập S3 bucket. Mount S3 bucket lên application server.',
    },
  },
  306: {
    questionVi:
      'Một công ty muốn chạy in-memory database cho ứng dụng nhạy cảm độ trễ chạy trên Amazon EC2 instances. Ứng dụng xử lý hơn 100.000 giao dịch mỗi phút và yêu cầu network throughput cao. Kiến trúc sư giải pháp cần thiết kế mạng tiết kiệm chi phí, giảm thiểu phí data transfer. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Khởi chạy tất cả EC2 instances trong cùng Availability Zone trong cùng AWS Region. Chỉ định placement group với cluster strategy khi khởi chạy EC2 instances.',
      B: 'Khởi chạy tất cả EC2 instances ở các Availability Zones khác nhau trong cùng AWS Region. Chỉ định placement group với partition strategy khi khởi chạy EC2 instances.',
      C: 'Triển khai Auto Scaling group khởi chạy EC2 instances ở các Availability Zones khác nhau dựa trên network utilization target.',
      D: 'Triển khai Auto Scaling group với step scaling policy khởi chạy EC2 instances ở các Availability Zones khác nhau.',
    },
  },
  307: {
    questionVi:
      'Một công ty chủ yếu chạy application servers on-premises quyết định migrate lên AWS. Công ty muốn giảm tối thiểu nhu cầu scale Internet Small Computer Systems Interface (iSCSI) storage on-premises. Công ty chỉ muốn dữ liệu truy cập gần đây vẫn lưu local. Công ty nên dùng giải pháp AWS nào?',
    optionsVi: {
      A: 'Amazon S3 File Gateway',
      B: 'AWS Storage Gateway Tape Gateway',
      C: 'AWS Storage Gateway Volume Gateway stored volumes',
      D: 'AWS Storage Gateway Volume Gateway cached volumes',
    },
  },
  308: {
    questionVi:
      'Một công ty có nhiều tài khoản AWS dùng consolidated billing. Công ty chạy nhiều Amazon RDS for Oracle On-Demand DB instances hiệu năng cao trong 90 ngày. Đội tài chính có quyền truy cập AWS Trusted Advisor trong consolidated billing account và tất cả tài khoản AWS khác. Đội tài chính cần dùng tài khoản AWS phù hợp truy cập Trusted Advisor check recommendations cho RDS. Đội tài chính phải rà soát Trusted Advisor check phù hợp để giảm chi phí RDS. Đội tài chính nên kết hợp bước nào? (Chọn hai.)',
    optionsVi: {
      A: 'Dùng Trusted Advisor recommendations từ tài khoản nơi RDS instances đang chạy.',
      B: 'Dùng Trusted Advisor recommendations từ consolidated billing account để xem tất cả RDS instance checks cùng lúc.',
      C: 'Rà soát Trusted Advisor check cho Amazon RDS Reserved Instance Optimization.',
      D: 'Rà soát Trusted Advisor check cho Amazon RDS Idle DB Instances.',
      E: 'Rà soát Trusted Advisor check cho Amazon Redshift Reserved Node Optimization.',
    },
  },
  309: {
    questionVi:
      'Kiến trúc sư giải pháp cần tối ưu chi phí lưu trữ. Kiến trúc sư giải pháp phải xác định Amazon S3 buckets nào không còn được truy cập hoặc hiếm khi được truy cập. Giải pháp nào đạt mục tiêu với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Phân tích bucket access patterns bằng S3 Storage Lens dashboard cho advanced activity metrics.',
      B: 'Phân tích bucket access patterns bằng S3 dashboard trong AWS Management Console.',
      C: 'Bật metric Amazon CloudWatch BucketSizeBytes cho buckets. Phân tích bucket access patterns bằng dữ liệu metrics với Amazon Athena.',
      D: 'Bật AWS CloudTrail giám sát S3 object. Phân tích bucket access patterns bằng CloudTrail logs tích hợp với Amazon CloudWatch Logs.',
    },
  },
  310: {
    questionVi:
      'Một công ty bán datasets cho khách hàng nghiên cứu artificial intelligence và machine learning (AI/ML). Datasets là tệp lớn, định dạng hóa lưu trong Amazon S3 bucket ở Region us-east-1. Công ty host ứng dụng web để khách hàng mua quyền truy cập dataset. Ứng dụng web triển khai trên nhiều Amazon EC2 instances phía sau Application Load Balancer. Sau khi mua, khách hàng nhận S3 signed URL cho phép truy cập tệp. Khách hàng phân bố ở Bắc Mỹ và châu Âu. Công ty muốn giảm chi phí data transfer và duy trì hoặc cải thiện hiệu năng. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Cấu hình S3 Transfer Acceleration trên S3 bucket hiện có. Hướng yêu cầu khách hàng tới S3 Transfer Acceleration endpoint. Tiếp tục dùng S3 signed URLs cho access control.',
      B: 'Triển khai Amazon CloudFront distribution với S3 bucket hiện có làm origin. Hướng yêu cầu khách hàng tới CloudFront URL. Chuyển sang CloudFront signed URLs cho access control.',
      C: 'Thiết lập S3 bucket thứ hai ở Region eu-central-1 với S3 Cross-Region Replication giữa các buckets. Hướng yêu cầu khách hàng tới Region gần nhất. Tiếp tục dùng S3 signed URLs cho access control.',
      D: 'Sửa ứng dụng web bật streaming datasets tới end users. Cấu hình ứng dụng web đọc dữ liệu từ S3 bucket hiện có. Triển khai access control trực tiếp trong ứng dụng.',
    },
  },
  311: {
    questionVi:
      'Một công ty dùng AWS thiết kế ứng dụng web xử lý báo giá bảo hiểm. Người dùng sẽ yêu cầu báo giá từ ứng dụng. Báo giá phải được tách theo loại báo giá, phải được phản hồi trong 24 giờ và không được mất. Giải pháp phải tối đa hóa hiệu quả vận hành và giảm tối thiểu bảo trì. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo nhiều Amazon Kinesis data streams theo loại báo giá. Cấu hình ứng dụng web gửi message tới data stream phù hợp. Cấu hình mỗi nhóm application servers backend dùng Kinesis Client Library (KCL) lấy message từ data stream riêng.',
      B: 'Tạo AWS Lambda function và Amazon Simple Notification Service (Amazon SNS) topic cho từng loại báo giá. Subscribe Lambda function vào SNS topic tương ứng. Cấu hình ứng dụng publish yêu cầu báo giá tới SNS topic phù hợp.',
      C: 'Tạo một Amazon Simple Notification Service (Amazon SNS) topic. Subscribe Amazon Simple Queue Service (Amazon SQS) queues vào SNS topic. Cấu hình SNS message filtering publish message tới SQS queue phù hợp theo loại báo giá. Cấu hình mỗi application server backend dùng SQS queue riêng.',
      D: 'Tạo nhiều Amazon Kinesis Data Firehose delivery streams theo loại báo giá gửi data streams tới Amazon OpenSearch Service cluster. Cấu hình ứng dụng gửi message tới delivery stream phù hợp. Cấu hình mỗi nhóm application servers backend tìm message từ OpenSearch Service và xử lý tương ứng.',
    },
  },
};

const out = writeBatch(11, 287, 311, T);
console.log('Wrote', out);
