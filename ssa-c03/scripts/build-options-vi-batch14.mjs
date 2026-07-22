#!/usr/bin/env node
import { writeBatch } from './build-options-vi-batches.mjs';

const T = {
  362: {
    questionVi:
      'Một công ty dùng hệ thống xử lý thanh toán yêu cầu messages của cùng payment ID phải nhận đúng thứ tự đã gửi. Nếu không, thanh toán có thể xử lý sai. Kiến trúc sư giải pháp nên làm gì? (Chọn hai.)',
    optionsVi: {
      A: 'Ghi messages vào bảng Amazon DynamoDB với payment ID làm partition key.',
      B: 'Ghi messages vào Amazon Kinesis data stream với payment ID làm partition key.',
      C: 'Ghi messages vào Amazon ElastiCache for Memcached cluster với payment ID làm key.',
      D: 'Ghi messages vào Amazon Simple Queue Service (Amazon SQS) queue. Đặt message attribute dùng payment ID.',
      E: 'Ghi messages vào Amazon Simple Queue Service (Amazon SQS) FIFO queue. Đặt message group dùng payment ID.',
    },
  },
  363: {
    questionVi:
      'Một công ty xây hệ thống game gửi unique events tới leaderboard, matchmaking và authentication services đồng thời. Công ty cần hệ thống event-driven trên AWS đảm bảo thứ tự events. Giải pháp nào đáp ứng?',
    optionsVi: {
      A: 'Amazon EventBridge event bus',
      B: 'Amazon Simple Notification Service (Amazon SNS) FIFO topics',
      C: 'Amazon Simple Notification Service (Amazon SNS) standard topics',
      D: 'Amazon Simple Queue Service (Amazon SQS) FIFO queues',
    },
  },
  364: {
    questionVi:
      'Một bệnh viện thiết kế ứng dụng mới thu thập triệu chứng từ bệnh nhân. Bệnh viện quyết định dùng Amazon Simple Queue Service (Amazon SQS) và Amazon Simple Notification Service (Amazon SNS) trong kiến trúc. Kiến trúc sư giải pháp đang review thiết kế hạ tầng. Dữ liệu phải mã hóa at rest và in transit. Chỉ nhân sự được ủy quyền của bệnh viện mới truy cập dữ liệu. Nên kết hợp bước nào? (Chọn hai.)',
    optionsVi: {
      A: 'Bật server-side encryption trên SQS components. Cập nhật default key policy hạn chế key usage cho tập authorized principals.',
      B: 'Bật server-side encryption trên SNS components bằng AWS Key Management Service (AWS KMS) customer managed key. Áp dụng key policy hạn chế key usage cho tập authorized principals.',
      C: 'Bật encryption trên SNS components. Cập nhật default key policy hạn chế key usage cho tập authorized principals. Đặt điều kiện trong topic policy chỉ cho phép kết nối mã hóa qua TLS.',
      D: 'Bật server-side encryption trên SQS components bằng AWS KMS customer managed key. Áp dụng key policy hạn chế key usage cho tập authorized principals. Đặt điều kiện trong queue policy chỉ cho phép kết nối mã hóa qua TLS.',
      E: 'Bật server-side encryption trên SQS components bằng AWS KMS customer managed key. Áp dụng IAM policy hạn chế key usage cho tập authorized principals. Đặt điều kiện trong queue policy chỉ cho phép kết nối mã hóa qua TLS.',
    },
  },
  365: {
    questionVi:
      'Một công ty chạy web application backed bởi Amazon RDS. Quản trị viên database mới gây mất dữ liệu do sửa nhầm bảng database. Để phục hồi loại sự cố này, công ty muốn khả năng restore database về trạng thái 5 phút trước mọi thay đổi trong 30 ngày qua. Kiến trúc sư giải pháp nên gồm tính năng nào?',
    optionsVi: {
      A: 'Read replicas',
      B: 'Manual snapshots',
      C: 'Automated backups',
      D: 'Multi-AZ deployments',
    },
  },
  366: {
    questionVi:
      'Web application của công ty gồm Amazon API Gateway API phía trước AWS Lambda function và Amazon DynamoDB database. Lambda xử lý business logic, DynamoDB lưu dữ liệu. Ứng dụng dùng Amazon Cognito user pools xác định từng user. Kiến trúc sư giải pháp cần cập nhật ứng dụng để chỉ user có subscription mới truy cập premium content. Giải pháp nào đáp ứng với operational overhead THẤP NHẤT?',
    optionsVi: {
      A: 'Bật API caching và throttling trên API Gateway API.',
      B: 'Thiết lập AWS WAF trên API Gateway API. Tạo rule lọc users có subscription.',
      C: 'Áp dụng fine-grained IAM permissions cho premium content trong bảng DynamoDB.',
      D: 'Triển khai API usage plans và API keys giới hạn truy cập users không có subscription.',
    },
  },
  367: {
    questionVi:
      'Một công ty dùng Amazon Route 53 latency-based routing định tuyến request tới UDP application cho users toàn cầu. Application host trên redundant servers trong data centers on-premises ở Mỹ, châu Á và châu Âu. Yêu cầu compliance bắt buộc application host on-premises. Công ty muốn cải thiện hiệu năng và availability. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Cấu hình ba Network Load Balancers (NLBs) ở ba AWS Regions trỏ tới on-premises endpoints. Tạo accelerator bằng AWS Global Accelerator, đăng ký NLBs làm endpoints. Cung cấp truy cập bằng CNAME trỏ tới accelerator DNS.',
      B: 'Cấu hình ba Application Load Balancers (ALBs) ở ba AWS Regions trỏ tới on-premises endpoints. Tạo accelerator bằng AWS Global Accelerator, đăng ký ALBs làm endpoints. Cung cấp truy cập bằng CNAME trỏ tới accelerator DNS.',
      C: 'Cấu hình ba Network Load Balancers (NLBs) ở ba AWS Regions trỏ tới on-premises endpoints. Trong Route 53, tạo latency-based record trỏ tới ba NLBs và dùng làm origin cho Amazon CloudFront distribution. Cung cấp truy cập bằng CNAME trỏ tới CloudFront DNS.',
      D: 'Cấu hình ba Application Load Balancers (ALBs) ở ba AWS Regions trỏ tới on-premises endpoints. Trong Route 53, tạo latency-based record trỏ tới ba ALBs và dùng làm origin cho Amazon CloudFront distribution. Cung cấp truy cập bằng CNAME trỏ tới CloudFront DNS.',
    },
  },
  368: {
    questionVi:
      'Kiến trúc sư giải pháp muốn mọi IAM user mới có yêu cầu password complexity cụ thể và thời gian xoay vòng bắt buộc. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Đặt overall password policy cho toàn bộ AWS account.',
      B: 'Đặt password policy cho từng IAM user trong AWS account.',
      C: 'Dùng phần mềm vendor bên thứ ba đặt yêu cầu password.',
      D: 'Gắn Amazon CloudWatch rule vào sự kiện Create_newuser để đặt password với yêu cầu phù hợp.',
    },
  },
  369: {
    questionVi:
      'Một công ty đã migrate ứng dụng lên Amazon EC2 Linux instances. Một trong các EC2 instances chạy nhiều task 1 giờ theo lịch. Các task do teams khác nhau viết và không có ngôn ngữ lập trình chung. Công ty lo ngại hiệu năng và scalability khi các task chạy trên một instance. Kiến trúc sư giải pháp cần giải pháp giải quyết với operational overhead THẤP NHẤT.',
    optionsVi: {
      A: 'Dùng AWS Batch chạy tasks dưới dạng jobs. Lên lịch jobs bằng Amazon EventBridge (Amazon CloudWatch Events).',
      B: 'Chuyển EC2 instance sang container. Dùng AWS App Runner tạo container on demand chạy tasks dưới dạng jobs.',
      C: 'Copy tasks sang AWS Lambda functions. Lên lịch Lambda functions bằng Amazon EventBridge (Amazon CloudWatch Events).',
      D: 'Tạo Amazon Machine Image (AMI) của EC2 instance chạy tasks. Tạo Auto Scaling group với AMI chạy nhiều bản copy instance.',
    },
  },
  370: {
    questionVi:
      'Một công ty chạy public three-tier web application trong VPC. Ứng dụng chạy trên Amazon EC2 instances trên nhiều Availability Zones. EC2 instances trong private subnets cần giao tiếp với license server qua internet. Công ty cần managed solution tối thiểu operational maintenance. Giải pháp nào đáp ứng?',
    optionsVi: {
      A: 'Cấp phát NAT instance trong public subnet. Sửa route table mỗi private subnet với default route trỏ tới NAT instance.',
      B: 'Cấp phát NAT instance trong private subnet. Sửa route table mỗi private subnet với default route trỏ tới NAT instance.',
      C: 'Cấp phát NAT gateway trong public subnet. Sửa route table mỗi private subnet với default route trỏ tới NAT gateway.',
      D: 'Cấp phát NAT gateway trong private subnet. Sửa route table mỗi private subnet với default route trỏ tới NAT gateway.',
    },
  },
  371: {
    questionVi:
      'Một công ty cần tạo Amazon Elastic Kubernetes Service (Amazon EKS) cluster host ứng dụng streaming media kỹ thuật số. EKS cluster dùng managed node group backed bởi Amazon Elastic Block Store (Amazon EBS) volumes cho storage. Công ty phải mã hóa mọi dữ liệu at rest bằng customer managed key trong AWS Key Management Service (AWS KMS). Nên kết hợp hành động nào với operational overhead THẤP NHẤT? (Chọn hai.)',
    optionsVi: {
      A: 'Dùng Kubernetes plugin dùng customer managed key thực hiện data encryption.',
      B: 'Sau khi tạo EKS cluster, tìm EBS volumes. Bật encryption bằng customer managed key.',
      C: 'Bật EBS encryption by default trong AWS Region sẽ tạo EKS cluster. Chọn customer managed key làm default key.',
      D: 'Tạo EKS cluster. Tạo IAM role có policy cấp quyền customer managed key. Liên kết role với EKS cluster.',
      E: 'Lưu customer managed key dưới dạng Kubernetes secret trong EKS cluster. Dùng customer managed key mã hóa EBS volumes.',
    },
  },
  372: {
    questionVi:
      'Một công ty muốn migrate Oracle database lên AWS. Database gồm một bảng chứa hàng triệu ảnh geographic information systems (GIS) độ phân giải cao, xác định bằng geographic code. Khi thiên tai xảy ra, hàng chục nghìn ảnh được cập nhật mỗi vài phút. Mỗi geographic code có một ảnh hoặc row. Công ty cần giải pháp highly available và scalable trong các sự kiện đó. Giải pháp nào HIỆU QUẢ CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Lưu ảnh và geographic codes trong bảng database. Dùng Oracle chạy trên Amazon RDS Multi-AZ DB instance.',
      B: 'Lưu ảnh trong Amazon S3 buckets. Dùng Amazon DynamoDB với geographic code làm key và image S3 URL làm value.',
      C: 'Lưu ảnh và geographic codes trong bảng Amazon DynamoDB. Cấu hình DynamoDB Accelerator (DAX) khi high load.',
      D: 'Lưu ảnh trong Amazon S3 buckets. Lưu geographic codes và image S3 URLs trong bảng database. Dùng Oracle chạy trên Amazon RDS Multi-AZ DB instance.',
    },
  },
  373: {
    questionVi:
      'Một công ty có ứng dụng thu thập dữ liệu từ cảm biến IoT trên ô tô. Dữ liệu được stream và lưu trong Amazon S3 qua Amazon Kinesis Data Firehose. Dữ liệu tạo hàng nghìn tỷ S3 objects mỗi năm. Mỗi sáng, công ty dùng dữ liệu 30 ngày trước để retrain suite ML models. Bốn lần mỗi năm, công ty dùng dữ liệu 12 tháng trước phân tích và train ML models khác. Dữ liệu phải khả dụng với độ trễ tối thiểu tới 1 năm. Sau 1 năm, dữ liệu giữ cho archive. Giải pháp storage nào HIỆU QUẢ CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng S3 Intelligent-Tiering storage class. Tạo S3 Lifecycle policy chuyển objects sang S3 Glacier Deep Archive sau 1 năm.',
      B: 'Dùng S3 Intelligent-Tiering storage class. Cấu hình S3 Intelligent-Tiering tự động chuyển objects sang S3 Glacier Deep Archive sau 1 năm.',
      C: 'Dùng S3 Standard-Infrequent Access (S3 Standard-IA) storage class. Tạo S3 Lifecycle policy chuyển objects sang S3 Glacier Deep Archive sau 1 năm.',
      D: 'Dùng S3 Standard storage class. Tạo S3 Lifecycle policy chuyển objects sang S3 Standard-IA sau 30 ngày, rồi sang S3 Glacier Deep Archive sau 1 năm.',
    },
  },
  374: {
    questionVi:
      'Một công ty chạy nhiều business applications trong ba VPC riêng ở Region us-east-1. Applications phải giao tiếp giữa các VPC. Applications cũng phải gửi hàng trăm gigabyte dữ liệu mỗi ngày tới latency-sensitive application trong một data center on-premises. Kiến trúc sư giải pháp cần thiết kế network connectivity tối đa cost-effectiveness. Giải pháp nào đáp ứng?',
    optionsVi: {
      A: 'Cấu hình ba AWS Site-to-Site VPN connections từ data center tới AWS. Thiết lập connectivity bằng cách cấu hình một VPN connection cho mỗi VPC.',
      B: 'Khởi chạy third-party virtual network appliance trong mỗi VPC. Thiết lập IPsec VPN tunnel giữa data center và mỗi virtual appliance.',
      C: 'Thiết lập ba AWS Direct Connect connections từ data center tới Direct Connect gateway ở us-east-1. Thiết lập connectivity bằng cách cấu hình mỗi VPC dùng một Direct Connect connection.',
      D: 'Thiết lập một AWS Direct Connect connection từ data center tới AWS. Tạo transit gateway và attach mỗi VPC vào transit gateway. Thiết lập connectivity giữa Direct Connect connection và transit gateway.',
    },
  },
  375: {
    questionVi:
      'Một công ty ecommerce xây distributed application gồm nhiều serverless functions và dịch vụ AWS hoàn tất order-processing tasks. Các tasks cần manual approvals trong workflow. Kiến trúc sư giải pháp cần thiết kế architecture cho order-processing application. Giải pháp phải kết hợp nhiều AWS Lambda functions thành responsive serverless applications. Giải pháp cũng phải orchestrate data và services chạy trên Amazon EC2 instances, containers hoặc on-premises servers. Giải pháp nào đáp ứng với operational overhead THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Step Functions xây application.',
      B: 'Tích hợp tất cả application components trong AWS Glue job.',
      C: 'Dùng Amazon Simple Queue Service (Amazon SQS) xây application.',
      D: 'Dùng AWS Lambda functions và Amazon EventBridge events xây application.',
    },
  },
  376: {
    questionVi:
      'Một công ty đã khởi chạy Amazon RDS for MySQL DB instance. Hầu hết connections tới database từ serverless applications. Application traffic tới database thay đổi đáng kể theo khoảng ngẫu nhiên. Khi high demand, users báo applications gặp database connection rejection errors. Giải pháp nào giải quyết với operational overhead THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo proxy trong RDS Proxy. Cấu hình applications của users dùng DB instance qua RDS Proxy.',
      B: 'Triển khai Amazon ElastiCache for Memcached giữa applications của users và DB instance.',
      C: 'Migrate DB instance sang instance class khác có I/O capacity cao hơn. Cấu hình applications của users dùng DB instance mới.',
      D: 'Cấu hình Multi-AZ cho DB instance. Cấu hình applications của users chuyển đổi giữa các DB instances.',
    },
  },
  377: {
    questionVi:
      'Một công ty gần đây triển khai auditing system tập trung thông tin về OS versions, patching và installed software cho Amazon EC2 instances. Kiến trúc sư giải pháp phải đảm bảo mọi instances provisioned qua EC2 Auto Scaling groups gửi reports tới auditing system ngay khi launched và terminated. Giải pháp nào đạt mục tiêu HIỆU QUẢ NHẤT?',
    optionsVi: {
      A: 'Dùng scheduled AWS Lambda function chạy script remotely trên tất cả EC2 instances gửi dữ liệu tới audit system.',
      B: 'Dùng EC2 Auto Scaling lifecycle hooks chạy custom script gửi dữ liệu tới audit system khi instances launched và terminated.',
      C: 'Dùng EC2 Auto Scaling launch configuration chạy custom script qua user data gửi dữ liệu tới audit system khi instances launched và terminated.',
      D: 'Chạy custom script trên instance OS gửi dữ liệu tới audit system. Cấu hình script được gọi bởi EC2 Auto Scaling group khi instance starts và terminated.',
    },
  },
  378: {
    questionVi:
      'Một công ty phát triển real-time multiplayer game dùng UDP giao tiếp giữa client và servers trong Auto Scaling group. Demand spikes được dự đoán ban ngày, nên game server platform phải thích ứng. Developers muốn lưu gamer scores và non-relational data khác trong database solution tự scale không cần can thiệp. Kiến trúc sư giải pháp nên đề xuất gì?',
    optionsVi: {
      A: 'Dùng Amazon Route 53 phân phối traffic và Amazon Aurora Serverless cho data storage.',
      B: 'Dùng Network Load Balancer phân phối traffic và Amazon DynamoDB on-demand cho data storage.',
      C: 'Dùng Network Load Balancer phân phối traffic và Amazon Aurora Global Database cho data storage.',
      D: 'Dùng Application Load Balancer phân phối traffic và Amazon DynamoDB global tables cho data storage.',
    },
  },
  379: {
    questionVi:
      'Một công ty host frontend application dùng Amazon API Gateway API backend tích hợp AWS Lambda. Khi API nhận requests, Lambda function load nhiều libraries. Sau đó Lambda kết nối Amazon RDS database, xử lý dữ liệu và trả về frontend. Công ty muốn response latency thấp nhất cho mọi users với ít thay đổi operations nhất. Giải pháp nào đáp ứng?',
    optionsVi: {
      A: 'Thiết lập kết nối giữa frontend application và database để queries nhanh hơn bằng cách bypass API.',
      B: 'Cấu hình provisioned concurrency cho Lambda function xử lý requests.',
      C: 'Cache kết quả queries trong Amazon S3 để retrieval nhanh hơn cho datasets tương tự.',
      D: 'Tăng kích thước database để tăng số connections Lambda có thể thiết lập cùng lúc.',
    },
  },
  380: {
    questionVi:
      'Một công ty đang migrate workload on-premises lên AWS Cloud. Công ty đã dùng nhiều Amazon EC2 instances và Amazon RDS DB instances. Công ty muốn giải pháp tự động start và stop EC2 instances và DB instances ngoài giờ làm việc. Giải pháp phải tối thiểu chi phí và infrastructure maintenance. Giải pháp nào đáp ứng?',
    optionsVi: {
      A: 'Scale EC2 instances bằng elastic resize. Scale DB instances về zero ngoài giờ làm việc.',
      B: 'Khám phá AWS Marketplace tìm partner solutions tự động start và stop EC2 instances và DB instances theo lịch.',
      C: 'Khởi chạy EC2 instance khác. Cấu hình crontab schedule chạy shell scripts start và stop EC2 instances và DB instances theo lịch.',
      D: 'Tạo AWS Lambda function start và stop EC2 instances và DB instances. Cấu hình Amazon EventBridge gọi Lambda function theo lịch.',
    },
  },
  381: {
    questionVi:
      'Một công ty host three-tier web application gồm PostgreSQL database. Database lưu metadata từ documents. Công ty tìm metadata theo key terms để lấy documents review trong báo cáo hàng tháng. Documents lưu trong Amazon S3, thường chỉ ghi một lần nhưng cập nhật thường xuyên. Reporting process mất vài giờ với relational queries. Reporting không được chặn document modifications hoặc thêm documents mới. Kiến trúc sư giải pháp cần giải pháp tăng tốc reporting với ÍT thay đổi application code nhất.',
    optionsVi: {
      A: 'Thiết lập Amazon DocumentDB (with MongoDB compatibility) cluster mới gồm read replica. Scale read replica tạo reports.',
      B: 'Thiết lập Amazon Aurora PostgreSQL DB cluster mới gồm Aurora Replica. Gửi queries tới Aurora Replica tạo reports.',
      C: 'Thiết lập Amazon RDS for PostgreSQL Multi-AZ DB instance mới. Cấu hình reporting module query secondary RDS node để không ảnh hưởng primary node.',
      D: 'Thiết lập bảng Amazon DynamoDB mới lưu documents. Dùng fixed write capacity hỗ trợ document entries mới. Tự động scale read capacity hỗ trợ reports.',
    },
  },
  382: {
    questionVi:
      'Một công ty có three-tier application trên AWS ingest sensor data từ thiết bị users. Traffic qua Network Load Balancer (NLB), tới Amazon EC2 instances cho web tier, rồi EC2 instances cho application tier. Application tier gọi database. Kiến trúc sư giải pháp nên làm gì để cải thiện bảo mật data in transit?',
    optionsVi: {
      A: 'Cấu hình TLS listener. Triển khai server certificate trên NLB.',
      B: 'Cấu hình AWS Shield Advanced. Bật AWS WAF trên NLB.',
      C: 'Đổi load balancer sang Application Load Balancer (ALB). Bật AWS WAF trên ALB.',
      D: 'Mã hóa Amazon Elastic Block Store (Amazon EBS) volume trên EC2 instances bằng AWS Key Management Service (AWS KMS).',
    },
  },
  383: {
    questionVi:
      'Một công ty lên kế hoạch migrate commercial off-the-shelf application từ data center on-premises lên AWS. Phần mềm có licensing model dùng sockets và cores với capacity và uptime dự đoán được. Công ty muốn dùng licenses hiện có mua đầu năm nay. Tùy chọn Amazon EC2 pricing nào HIỆU QUẢ CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dedicated Reserved Hosts',
      B: 'Dedicated On-Demand Hosts',
      C: 'Dedicated Reserved Instances',
      D: 'Dedicated On-Demand Instances',
    },
  },
  384: {
    questionVi:
      'Một công ty chạy application trên Amazon EC2 Linux instances trên nhiều Availability Zones. Application cần storage layer highly available và tuân thủ Portable Operating System Interface (POSIX). Storage layer phải có data durability tối đa và shareable giữa EC2 instances. Dữ liệu trong storage layer được truy cập thường xuyên trong 30 ngày đầu và ít truy cập sau đó. Giải pháp nào HIỆU QUẢ CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon S3 Standard storage class. Tạo S3 Lifecycle policy chuyển dữ liệu ít truy cập sang S3 Glacier.',
      B: 'Dùng Amazon S3 Standard storage class. Tạo S3 Lifecycle policy chuyển dữ liệu ít truy cập sang S3 Standard-Infrequent Access (S3 Standard-IA).',
      C: 'Dùng Amazon Elastic File System (Amazon EFS) Standard storage class. Tạo lifecycle management policy chuyển dữ liệu ít truy cập sang EFS Standard-Infrequent Access (EFS Standard-IA).',
      D: 'Dùng Amazon Elastic File System (Amazon EFS) One Zone storage class. Tạo lifecycle management policy chuyển dữ liệu ít truy cập sang EFS One Zone-Infrequent Access (EFS One Zone-IA).',
    },
  },
  385: {
    questionVi:
      'Kiến trúc sư giải pháp tạo thiết kế VPC mới. Có hai public subnets cho load balancer, hai private subnets cho web servers và hai private subnets cho MySQL. Web servers chỉ dùng HTTPS. Kiến trúc sư giải pháp đã tạo security group cho load balancer cho phép port 443 từ 0.0.0.0/0. Chính sách công ty yêu cầu mỗi resource có quyền truy cập tối thiểu cần thiết. Nên dùng thêm chiến lược cấu hình nào?',
    optionsVi: {
      A: 'Tạo security group cho web servers cho phép port 443 từ 0.0.0.0/0. Tạo security group cho MySQL servers cho phép port 3306 từ web servers security group.',
      B: 'Tạo network ACL cho web servers cho phép port 443 từ 0.0.0.0/0. Tạo network ACL cho MySQL servers cho phép port 3306 từ web servers security group.',
      C: 'Tạo security group cho web servers cho phép port 443 từ load balancer. Tạo security group cho MySQL servers cho phép port 3306 từ web servers security group.',
      D: 'Tạo network ACL cho web servers cho phép port 443 từ load balancer. Tạo network ACL cho MySQL servers cho phép port 3306 từ web servers security group.',
    },
  },
  386: {
    questionVi:
      'Một công ty ecommerce chạy multi-tier application trên AWS. Frontend và backend tiers chạy trên Amazon EC2, database chạy Amazon RDS for MySQL. Backend tier giao tiếp với RDS instance. Có nhiều lời gọi trả về datasets giống nhau từ database gây chậm hiệu năng. Nên làm gì để cải thiện hiệu năng backend?',
    optionsVi: {
      A: 'Triển khai Amazon SNS lưu database calls.',
      B: 'Triển khai Amazon ElastiCache cache large datasets.',
      C: 'Triển khai RDS for MySQL read replica cache database calls.',
      D: 'Triển khai Amazon Kinesis Data Firehose stream calls tới database.',
    },
  },
};

const out = writeBatch(14, 362, 386, T);
console.log('Wrote', out);
