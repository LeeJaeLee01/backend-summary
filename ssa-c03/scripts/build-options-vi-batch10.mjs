#!/usr/bin/env node
import { writeBatch } from './build-options-vi-batches.mjs';

const T = {
  262: {
    questionVi:
      'Một công ty dự định dùng Amazon ElastiCache cho ứng dụng web đa tầng. Kiến trúc sư giải pháp tạo Cache VPC cho ElastiCache cluster và App VPC cho Amazon EC2 instances của ứng dụng. Cả hai VPC ở Region us-east-1. Kiến trúc sư giải pháp phải triển khai giải pháp cung cấp cho EC2 instances của ứng dụng truy cập ElastiCache cluster. Giải pháp nào đáp ứng TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Tạo peering connection giữa các VPC. Thêm route table entry cho peering connection trong cả hai VPC. Cấu hình inbound rule cho security group của ElastiCache cluster cho phép kết nối inbound từ security group của ứng dụng.',
      B: 'Tạo Transit VPC. Cập nhật VPC route tables trong Cache VPC và App VPC định tuyến traffic qua Transit VPC. Cấu hình inbound rule cho security group của ElastiCache cluster cho phép kết nối inbound từ security group của ứng dụng.',
      C: 'Tạo peering connection giữa các VPC. Thêm route table entry cho peering connection trong cả hai VPC. Cấu hình inbound rule cho security group của peering connection cho phép kết nối inbound từ security group của ứng dụng.',
      D: 'Tạo Transit VPC. Cập nhật VPC route tables trong Cache VPC và App VPC định tuyến traffic qua Transit VPC. Cấu hình inbound rule cho security group của Transit VPC cho phép kết nối inbound từ security group của ứng dụng.',
    },
  },
  263: {
    questionVi:
      'Một công ty xây dựng ứng dụng gồm nhiều microservices. Công ty quyết định dùng công nghệ container triển khai phần mềm lên AWS. Công ty cần giải pháp giảm tối đa công sức bảo trì và mở rộng. Công ty không thể quản lý thêm hạ tầng. Kiến trúc sư giải pháp nên kết hợp hành động nào? (Chọn hai.)',
    optionsVi: {
      A: 'Triển khai Amazon Elastic Container Service (Amazon ECS) cluster.',
      B: 'Triển khai Kubernetes control plane trên Amazon EC2 instances trải nhiều Availability Zones.',
      C: 'Triển khai Amazon ECS service với Amazon EC2 launch type. Chỉ định desired task number level lớn hơn hoặc bằng 2.',
      D: 'Triển khai Amazon ECS service với Fargate launch type. Chỉ định desired task number level lớn hơn hoặc bằng 2.',
      E: 'Triển khai Kubernetes worker nodes trên Amazon EC2 instances trải nhiều Availability Zones. Tạo deployment chỉ định hai hoặc nhiều replicas cho mỗi microservice.',
    },
  },
  264: {
    questionVi:
      'Một công ty có ứng dụng web host trên 10 Amazon EC2 instances với traffic do Amazon Route 53 định tuyến. Công ty thỉnh thoảng gặp lỗi timeout khi duyệt ứng dụng. Đội mạng phát hiện một số truy vấn DNS trả về địa chỉ IP của instances không khỏe mạnh, gây timeout. Kiến trúc sư giải pháp nên triển khai gì?',
    optionsVi: {
      A: 'Tạo Route 53 simple routing policy record cho từng EC2 instance. Gắn health check với từng record.',
      B: 'Tạo Route 53 failover routing policy record cho từng EC2 instance. Gắn health check với từng record.',
      C: 'Tạo Amazon CloudFront distribution với EC2 instances làm origin. Gắn health check với EC2 instances.',
      D: 'Tạo Application Load Balancer (ALB) có health check phía trước EC2 instances. Định tuyến tới ALB từ Route 53.',
    },
  },
  265: {
    questionVi:
      'Kiến trúc sư giải pháp cần thiết kế ứng dụng có tính sẵn sàng cao gồm tầng web, application và database. Phân phối nội dung HTTPS phải gần edge nhất với thời gian phân phối ngắn nhất. Giải pháp nào đáp ứng các yêu cầu này và AN TOÀN NHẤT?',
    optionsVi: {
      A: 'Cấu hình public Application Load Balancer (ALB) với nhiều Amazon EC2 instances dự phòng trong public subnets. Cấu hình Amazon CloudFront phân phối nội dung HTTPS dùng public ALB làm origin.',
      B: 'Cấu hình public Application Load Balancer với nhiều Amazon EC2 instances dự phòng trong private subnets. Cấu hình Amazon CloudFront phân phối nội dung HTTPS dùng EC2 instances làm origin.',
      C: 'Cấu hình public Application Load Balancer (ALB) với nhiều Amazon EC2 instances dự phòng trong private subnets. Cấu hình Amazon CloudFront phân phối nội dung HTTPS dùng public ALB làm origin.',
      D: 'Cấu hình public Application Load Balancer với nhiều Amazon EC2 instances dự phòng trong public subnets. Cấu hình Amazon CloudFront phân phối nội dung HTTPS dùng EC2 instances làm origin.',
    },
  },
  266: {
    questionVi:
      'Một công ty có nền tảng game phổ biến chạy trên AWS. Ứng dụng nhạy cảm với độ trễ vì độ trễ ảnh hưởng trải nghiệm người dùng và tạo lợi thế không công bằng. Ứng dụng triển khai trên mọi AWS Region, chạy trên Amazon EC2 instances trong Auto Scaling groups phía sau Application Load Balancers (ALBs). Kiến trúc sư giải pháp cần cơ chế giám sát sức khỏe ứng dụng và chuyển hướng traffic tới endpoint khỏe mạnh. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cấu hình accelerator trong AWS Global Accelerator. Thêm listener cho cổng ứng dụng lắng nghe và gắn Regional endpoint ở từng Region. Thêm ALB làm endpoint.',
      B: 'Tạo Amazon CloudFront distribution và chỉ định ALB làm origin server. Cấu hình cache behavior dùng origin cache headers. Dùng AWS Lambda functions tối ưu traffic.',
      C: 'Tạo Amazon CloudFront distribution và chỉ định Amazon S3 làm origin server. Cấu hình cache behavior dùng origin cache headers. Dùng AWS Lambda functions tối ưu traffic.',
      D: 'Cấu hình Amazon DynamoDB database làm data store cho ứng dụng. Tạo DynamoDB Accelerator (DAX) cluster làm in-memory cache cho DynamoDB host dữ liệu ứng dụng.',
    },
  },
  267: {
    questionVi:
      'Một công ty có một triệu người dùng dùng ứng dụng di động. Công ty phải phân tích mẫu sử dụng dữ liệu gần thời gian thực. Công ty cũng phải mã hóa dữ liệu gần thời gian thực và lưu dữ liệu tập trung ở định dạng Apache Parquet để xử lý tiếp. Giải pháp nào đáp ứng với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo Amazon Kinesis data stream lưu dữ liệu trong Amazon S3. Tạo Amazon Kinesis Data Analytics application phân tích dữ liệu. Gọi AWS Lambda function gửi dữ liệu tới Kinesis Data Analytics application.',
      B: 'Tạo Amazon Kinesis data stream lưu dữ liệu trong Amazon S3. Tạo Amazon EMR cluster phân tích dữ liệu. Gọi AWS Lambda function gửi dữ liệu tới EMR cluster.',
      C: 'Tạo Amazon Kinesis Data Firehose delivery stream lưu dữ liệu trong Amazon S3. Tạo Amazon EMR cluster phân tích dữ liệu.',
      D: 'Tạo Amazon Kinesis Data Firehose delivery stream lưu dữ liệu trong Amazon S3. Tạo Amazon Kinesis Data Analytics application phân tích dữ liệu.',
    },
  },
  268: {
    questionVi:
      'Một công ty game có ứng dụng web hiển thị điểm số. Ứng dụng chạy trên Amazon EC2 instances phía sau Application Load Balancer. Ứng dụng lưu dữ liệu trong Amazon RDS for MySQL database. Người dùng bắt đầu gặp chậm trễ và gián đoạn do hiệu năng read database. Công ty muốn cải thiện trải nghiệm người dùng đồng thời tối thiểu hóa thay đổi kiến trúc ứng dụng. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Dùng Amazon ElastiCache phía trước database.',
      B: 'Dùng RDS Proxy giữa ứng dụng và database.',
      C: 'Migrate ứng dụng từ EC2 instances sang AWS Lambda.',
      D: 'Migrate database từ Amazon RDS for MySQL sang Amazon DynamoDB.',
    },
  },
  269: {
    questionVi:
      'Một công ty thương mại điện tử nhận thấy hiệu năng giảm của ứng dụng web dựa trên Amazon RDS do tăng số truy vấn SQL read-only do business analysts kích hoạt. Kiến trúc sư giải pháp cần giải quyết vấn đề với thay đổi tối thiểu cho ứng dụng web hiện có. Kiến trúc sư giải pháp nên đề xuất gì?',
    optionsVi: {
      A: 'Export dữ liệu sang Amazon DynamoDB và để business analysts chạy truy vấn.',
      B: 'Nạp dữ liệu vào Amazon ElastiCache và để business analysts chạy truy vấn.',
      C: 'Tạo read replica của primary database và để business analysts chạy truy vấn.',
      D: 'Copy dữ liệu vào Amazon Redshift cluster và để business analysts chạy truy vấn.',
    },
  },
  270: {
    questionVi:
      'Một công ty dùng tài khoản AWS tập trung lưu log data trong nhiều Amazon S3 buckets. Kiến trúc sư giải pháp cần đảm bảo dữ liệu được mã hóa at rest trước khi upload lên S3 buckets. Dữ liệu cũng phải được mã hóa in transit. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng client-side encryption mã hóa dữ liệu upload lên S3 buckets.',
      B: 'Dùng server-side encryption mã hóa dữ liệu upload lên S3 buckets.',
      C: 'Tạo bucket policies yêu cầu dùng server-side encryption với S3 managed encryption keys (SSE-S3) cho S3 uploads.',
      D: 'Bật tùy chọn bảo mật mã hóa S3 buckets qua default AWS Key Management Service (AWS KMS) key.',
    },
  },
  271: {
    questionVi:
      'Kiến trúc sư giải pháp quan sát job xử lý batch hàng đêm tự động scale up trong 1 giờ trước khi đạt Amazon EC2 capacity mong muốn. Capacity đỉnh giống nhau mỗi đêm và batch jobs luôn bắt đầu lúc 1 giờ sáng. Kiến trúc sư giải pháp cần giải pháp tiết kiệm chi phí đạt EC2 capacity mong muốn nhanh và cho Auto Scaling group scale down sau khi batch jobs hoàn tất. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Tăng minimum capacity cho Auto Scaling group.',
      B: 'Tăng maximum capacity cho Auto Scaling group.',
      C: 'Cấu hình scheduled scaling scale up tới mức compute mong muốn.',
      D: 'Đổi scaling policy thêm nhiều EC2 instances hơn trong mỗi thao tác scaling.',
    },
  },
  272: {
    questionVi:
      'Một công ty phục vụ website động từ fleet Amazon EC2 instances phía sau Application Load Balancer (ALB). Website cần hỗ trợ nhiều ngôn ngữ cho khách hàng toàn cầu. Kiến trúc chạy ở Region us-west-1 và có độ trễ yêu cầu cao cho người dùng ở các khu vực khác. Website cần phục vụ yêu cầu nhanh và hiệu quả bất kể vị trí người dùng. Tuy nhiên, công ty không muốn tái tạo kiến trúc hiện có trên nhiều Regions. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Thay kiến trúc hiện có bằng website phục vụ từ Amazon S3 bucket. Cấu hình Amazon CloudFront distribution với S3 bucket làm origin. Đặt cache behavior settings cache theo header Accept-Language.',
      B: 'Cấu hình Amazon CloudFront distribution với ALB làm origin. Đặt cache behavior settings cache theo header Accept-Language.',
      C: 'Tạo Amazon API Gateway API tích hợp với ALB. Cấu hình API dùng HTTP integration type. Thiết lập API Gateway stage bật API cache theo header Accept-Language.',
      D: 'Khởi chạy EC2 instance ở từng Region bổ sung và cấu hình NGINX làm cache server cho Region đó. Đặt tất cả EC2 instances và ALB phía sau Amazon Route 53 record set với geolocation routing policy.',
    },
  },
  273: {
    questionVi:
      'Một công ty thương mại điện tử phát triển nhanh chạy workload trong một AWS Region. Kiến trúc sư giải pháp phải tạo chiến lược disaster recovery (DR) gồm AWS Region khác. Công ty muốn database cập nhật ở DR Region với độ trễ thấp nhất. Hạ tầng còn lại ở DR Region chạy ở capacity giảm và có thể scale up khi cần. Giải pháp nào đáp ứng với recovery time objective (RTO) THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon Aurora global database với pilot light deployment.',
      B: 'Dùng Amazon Aurora global database với warm standby deployment.',
      C: 'Dùng Amazon RDS Multi-AZ DB instance với pilot light deployment.',
      D: 'Dùng Amazon RDS Multi-AZ DB instance với warm standby deployment.',
    },
  },
  274: {
    questionVi:
      'Một công ty chạy ứng dụng trên Amazon EC2 instances. Công ty cần triển khai giải pháp disaster recovery (DR) cho ứng dụng. DR phải có recovery time objective (RTO) dưới 4 giờ. DR cũng phải dùng ít tài nguyên AWS nhất trong vận hành bình thường. Giải pháp nào đáp ứng theo cách HIỆU QUẢ VẬN HÀNH NHẤT?',
    optionsVi: {
      A: 'Tạo Amazon Machine Images (AMIs) backup EC2 instances. Copy AMIs sang AWS Region phụ. Tự động hóa triển khai hạ tầng ở Region phụ bằng AWS Lambda và custom scripts.',
      B: 'Tạo AMIs backup EC2 instances. Copy AMIs sang AWS Region phụ. Tự động hóa triển khai hạ tầng ở Region phụ bằng AWS CloudFormation.',
      C: 'Khởi chạy EC2 instances ở AWS Region phụ. Giữ EC2 instances ở Region phụ hoạt động liên tục.',
      D: 'Khởi chạy EC2 instances ở Availability Zone phụ. Giữ EC2 instances ở Availability Zone phụ hoạt động liên tục.',
    },
  },
  275: {
    questionVi:
      'Một công ty chạy ứng dụng trình duyệt nội bộ. Ứng dụng chạy trên Amazon EC2 instances phía sau Application Load Balancer. Instances chạy trong Amazon EC2 Auto Scaling group trên nhiều Availability Zones. Auto Scaling group scale tới 20 instances trong giờ làm việc nhưng scale xuống 2 instances qua đêm. Nhân viên phàn nàn ứng dụng rất chậm khi bắt đầu ngày, dù giữa buổi sáng chạy tốt. Nên thay đổi scaling như thế nào để giải quyết phàn nàn và giữ chi phí tối thiểu?',
    optionsVi: {
      A: 'Triển khai scheduled action đặt desired capacity là 20 ngay trước khi văn phòng mở cửa.',
      B: 'Triển khai step scaling action kích hoạt ở ngưỡng CPU thấp hơn và giảm cooldown period.',
      C: 'Triển khai target tracking action kích hoạt ở ngưỡng CPU thấp hơn và giảm cooldown period.',
      D: 'Triển khai scheduled action đặt minimum và maximum capacity là 20 ngay trước khi văn phòng mở cửa.',
    },
  },
  276: {
    questionVi:
      'Một công ty có ứng dụng đa tầng triển khai trên nhiều Amazon EC2 instances trong Auto Scaling group. Amazon RDS for Oracle instance là data layer ứng dụng, dùng Oracle-specific PL/SQL functions. Traffic tới ứng dụng tăng đều. Điều này khiến EC2 instances quá tải và RDS instance hết storage. Auto Scaling group không có scaling metrics và chỉ định minimum healthy instance count. Công ty dự đoán traffic tiếp tục tăng đều nhưng không dự đoán được trước khi ổn định. Kiến trúc sư giải pháp nên làm gì để hệ thống tự động scale theo traffic tăng? (Chọn hai.)',
    optionsVi: {
      A: 'Cấu hình storage Auto Scaling trên RDS for Oracle instance.',
      B: 'Migrate database sang Amazon Aurora để dùng Auto Scaling storage.',
      C: 'Cấu hình alarm trên RDS for Oracle instance cho low free storage space.',
      D: 'Cấu hình Auto Scaling group dùng average CPU làm scaling metric.',
      E: 'Cấu hình Auto Scaling group dùng average free memory làm scaling metric.',
    },
  },
  277: {
    questionVi:
      'Một công ty cung cấp dịch vụ trực tuyến đăng nội dung video và transcode cho mọi nền tảng di động. Kiến trúc ứng dụng dùng Amazon Elastic File System (Amazon EFS) Standard thu thập và lưu video để nhiều Amazon EC2 Linux instances truy cập nội dung video để xử lý. Khi dịch vụ phổ biến tăng, chi phí lưu trữ trở nên quá đắt. Giải pháp lưu trữ nào TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Storage Gateway for files lưu trữ và xử lý nội dung video.',
      B: 'Dùng AWS Storage Gateway for volumes lưu trữ và xử lý nội dung video.',
      C: 'Dùng Amazon EFS lưu trữ nội dung video. Sau khi xử lý xong, chuyển tệp sang Amazon Elastic Block Store (Amazon EBS).',
      D: 'Dùng Amazon S3 lưu trữ nội dung video. Tạm thời chuyển tệp sang Amazon Elastic Block Store (Amazon EBS) volume gắn server để xử lý.',
    },
  },
  278: {
    questionVi:
      'Một công ty muốn tạo ứng dụng lưu dữ liệu nhân viên theo cấu trúc phân cấp. Công ty cần phản hồi độ trễ tối thiểu cho truy vấn traffic cao và phải bảo vệ dữ liệu nhạy cảm. Công ty cũng cần nhận email hàng tháng nếu có thông tin tài chính trong dữ liệu nhân viên. Kiến trúc sư giải pháp nên kết hợp bước nào? (Chọn hai.)',
    optionsVi: {
      A: 'Dùng Amazon Redshift lưu dữ liệu nhân viên theo phân cấp. Unload dữ liệu sang Amazon S3 mỗi tháng.',
      B: 'Dùng Amazon DynamoDB lưu dữ liệu nhân viên theo phân cấp. Export dữ liệu sang Amazon S3 mỗi tháng.',
      C: 'Cấu hình Amazon Macie cho tài khoản AWS. Tích hợp Macie với Amazon EventBridge gửi sự kiện hàng tháng tới AWS Lambda.',
      D: 'Dùng Amazon Athena phân tích dữ liệu nhân viên trong Amazon S3. Tích hợp Athena với Amazon QuickSight xuất bản dashboard phân tích và chia sẻ dashboard với người dùng.',
      E: 'Cấu hình Amazon Macie cho tài khoản AWS. Tích hợp Macie với Amazon EventBridge gửi thông báo hàng tháng qua đăng ký Amazon Simple Notification Service (Amazon SNS).',
    },
  },
  279: {
    questionVi:
      'Một công ty có ứng dụng được hỗ trợ bởi bảng Amazon DynamoDB. Yêu cầu tuân thủ quy định database backup phải được thực hiện mỗi tháng, khả dụng 6 tháng và giữ 7 năm. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo AWS Backup plan backup bảng DynamoDB vào ngày đầu mỗi tháng. Chỉ định lifecycle policy chuyển backup sang cold storage sau 6 tháng. Đặt retention period cho mỗi backup là 7 năm.',
      B: 'Tạo DynamoDB on-demand backup của bảng DynamoDB vào ngày đầu mỗi tháng. Chuyển backup sang Amazon S3 Glacier Flexible Retrieval sau 6 tháng. Tạo S3 Lifecycle policy xóa backup cũ hơn 7 năm.',
      C: 'Dùng AWS SDK phát triển script tạo on-demand backup của bảng DynamoDB. Thiết lập Amazon EventBridge rule chạy script vào ngày đầu mỗi tháng. Tạo script thứ hai chạy ngày thứ hai mỗi tháng chuyển DynamoDB backups cũ hơn 6 tháng sang cold storage và xóa backup cũ hơn 7 năm.',
      D: 'Dùng AWS CLI tạo on-demand backup của bảng DynamoDB. Thiết lập Amazon EventBridge rule chạy lệnh vào ngày đầu mỗi tháng với cron expression. Chỉ định trong lệnh chuyển backups sang cold storage sau 6 tháng và xóa backups sau 7 năm.',
    },
  },
  280: {
    questionVi:
      'Một công ty dùng Amazon CloudFront với website. Công ty đã bật logging trên CloudFront distribution và logs lưu trong một trong các Amazon S3 buckets của công ty. Công ty cần phân tích nâng cao trên logs và xây dựng trực quan hóa. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Dùng truy vấn SQL chuẩn trong Amazon Athena phân tích CloudFront logs trong S3 bucket. Trực quan hóa kết quả bằng AWS Glue.',
      B: 'Dùng truy vấn SQL chuẩn trong Amazon Athena phân tích CloudFront logs trong S3 bucket. Trực quan hóa kết quả bằng Amazon QuickSight.',
      C: 'Dùng truy vấn SQL chuẩn trong Amazon DynamoDB phân tích CloudFront logs trong S3 bucket. Trực quan hóa kết quả bằng AWS Glue.',
      D: 'Dùng truy vấn SQL chuẩn trong Amazon DynamoDB phân tích CloudFront logs trong S3 bucket. Trực quan hóa kết quả bằng Amazon QuickSight.',
    },
  },
  281: {
    questionVi:
      'Một công ty chạy fleet web servers dùng Amazon RDS for PostgreSQL DB instance. Sau kiểm tra tuân thủ định kỳ, công ty đặt tiêu chuẩn yêu cầu recovery point objective (RPO) dưới 1 giây cho tất cả production databases. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Bật triển khai Multi-AZ cho DB instance.',
      B: 'Bật auto scaling cho DB instance trong một Availability Zone.',
      C: 'Cấu hình DB instance trong một Availability Zone và tạo nhiều read replicas ở Availability Zone riêng.',
      D: 'Cấu hình DB instance trong một Availability Zone và cấu hình AWS Database Migration Service (AWS DMS) change data capture (CDC) tasks.',
    },
  },
  282: {
    questionVi:
      'Một công ty chạy ứng dụng web triển khai trên Amazon EC2 instances trong private subnet của VPC. Application Load Balancer (ALB) trải trên public subnets định tuyến web traffic tới EC2 instances. Công ty muốn triển khai biện pháp bảo mật mới hạn chế inbound traffic từ ALB tới EC2 instances đồng thời ngăn truy cập từ nguồn khác bên trong hoặc bên ngoài private subnet của EC2 instances. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cấu hình route trong route table định tuyến traffic từ internet tới private IP addresses của EC2 instances.',
      B: 'Cấu hình security group cho EC2 instances chỉ cho phép traffic từ security group của ALB.',
      C: 'Chuyển EC2 instances sang public subnet. Gán Elastic IP addresses cho EC2 instances.',
      D: 'Cấu hình security group cho ALB cho phép mọi TCP traffic trên mọi cổng.',
    },
  },
  283: {
    questionVi:
      'Một công ty nghiên cứu chạy thí nghiệm được hỗ trợ bởi ứng dụng mô phỏng và ứng dụng trực quan hóa. Ứng dụng mô phỏng chạy trên Linux và ghi dữ liệu trung gian vào NFS share mỗi 5 phút. Ứng dụng trực quan hóa là ứng dụng desktop Windows hiển thị output mô phỏng và yêu cầu SMB file system. Công ty duy trì hai file system đồng bộ. Chiến lược này gây trùng lặp dữ liệu và lãng phí tài nguyên. Công ty cần migrate ứng dụng lên AWS mà không thay đổi code của cả hai ứng dụng. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Migrate cả hai ứng dụng sang AWS Lambda. Tạo Amazon S3 bucket trao đổi dữ liệu giữa các ứng dụng.',
      B: 'Migrate cả hai ứng dụng sang Amazon Elastic Container Service (Amazon ECS). Cấu hình Amazon FSx File Gateway cho lưu trữ.',
      C: 'Migrate ứng dụng mô phỏng sang Linux Amazon EC2 instances. Migrate ứng dụng trực quan hóa sang Windows EC2 instances. Cấu hình Amazon Simple Queue Service (Amazon SQS) trao đổi dữ liệu giữa các ứng dụng.',
      D: 'Migrate ứng dụng mô phỏng sang Linux Amazon EC2 instances. Migrate ứng dụng trực quan hóa sang Windows EC2 instances. Cấu hình Amazon FSx for NetApp ONTAP cho lưu trữ.',
    },
  },
  284: {
    questionVi:
      'Trong lập kế hoạch ngân sách, ban quản lý muốn báo cáo các mục AWS billed liệt kê theo người dùng. Dữ liệu sẽ dùng tạo ngân sách phòng ban. Kiến trúc sư giải pháp cần xác định cách HIỆU QUẢ NHẤT để lấy thông tin báo cáo này. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Chạy truy vấn với Amazon Athena tạo báo cáo.',
      B: 'Tạo báo cáo trong Cost Explorer và tải báo cáo.',
      C: 'Truy cập chi tiết hóa đơn từ billing dashboard và tải hóa đơn.',
      D: 'Sửa cost budget trong AWS Budgets để cảnh báo bằng Amazon Simple Email Service (Amazon SES).',
    },
  },
  285: {
    questionVi:
      'Một công ty host website tĩnh bằng Amazon S3. Công ty muốn thêm form liên hệ vào trang web. Form liên hệ sẽ có thành phần server-side động để người dùng nhập tên, email, số điện thoại và tin nhắn. Công ty dự kiến dưới 100 lượt truy cập site mỗi tháng. Giải pháp nào đáp ứng TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Host trang form liên hệ động trong Amazon Elastic Container Service (Amazon ECS). Thiết lập Amazon Simple Email Service (Amazon SES) kết nối nhà cung cấp email bên thứ ba.',
      B: 'Tạo Amazon API Gateway endpoint với AWS Lambda backend gọi Amazon Simple Email Service (Amazon SES).',
      C: 'Chuyển trang tĩnh sang động bằng cách triển khai Amazon Lightsail. Dùng client-side scripting xây dựng form liên hệ. Tích hợp form với Amazon WorkMail.',
      D: 'Tạo t2.micro Amazon EC2 instance. Triển khai LAMP (Linux, Apache, MySQL, PHP/Perl/Python) stack host trang web. Dùng client-side scripting xây dựng form liên hệ. Tích hợp form với Amazon WorkMail.',
    },
  },
  286: {
    questionVi:
      'Một công ty có website tĩnh host trên Amazon CloudFront phía trước Amazon S3. Website tĩnh dùng database backend. Công ty nhận thấy website không phản ánh cập nhật đã thực hiện trong Git repository của website. Công ty kiểm tra pipeline continuous integration và continuous delivery (CI/CD) giữa Git repository và Amazon S3. Công ty xác minh webhooks được cấu hình đúng và pipeline CI/CD gửi message cho biết triển khai thành công. Kiến trúc sư giải pháp cần triển khai giải pháp hiển thị cập nhật trên website. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Thêm Application Load Balancer.',
      B: 'Thêm Amazon ElastiCache for Redis hoặc Memcached vào database layer của ứng dụng web.',
      C: 'Invalidate CloudFront cache.',
      D: 'Dùng AWS Certificate Manager (ACM) xác thực SSL certificate của website.',
    },
  },
};

const out = writeBatch(10, 262, 286, T);
console.log('Wrote', out);
