#!/usr/bin/env node
import { writeBatch } from './build-options-vi-batches.mjs';

const T = {
  212: {
    questionVi:
      'Một công ty cần export database mỗi ngày lên Amazon S3 để các đội khác truy cập. Kích thước object export dao động từ 2 GB đến 5 GB. Mẫu truy cập S3 thay đổi nhanh và không ổn định. Dữ liệu phải sẵn sàng ngay lập tức và vẫn truy cập được tới 3 tháng. Công ty cần giải pháp tiết kiệm chi phí nhất, không tăng thời gian truy xuất. Công ty nên dùng S3 storage class nào?',
    optionsVi: {
      A: 'S3 Intelligent-Tiering',
      B: 'S3 Glacier Instant Retrieval',
      C: 'S3 Standard',
      D: 'S3 Standard-Infrequent Access (S3 Standard-IA)',
    },
  },
  213: {
    questionVi:
      'Một công ty đang phát triển ứng dụng di động mới. Công ty phải triển khai lọc traffic phù hợp để bảo vệ Application Load Balancer (ALB) khỏi các tấn công ở tầng ứng dụng phổ biến như cross-site scripting hoặc SQL injection. Công ty có hạ tầng và nhân sự vận hành tối thiểu. Công ty cần giảm trách nhiệm quản lý, cập nhật và bảo mật server trong môi trường AWS. Kiến trúc sư giải pháp nên đề xuất gì?',
    optionsVi: {
      A: 'Cấu hình AWS WAF rules và liên kết với ALB.',
      B: 'Triển khai ứng dụng bằng Amazon S3 với public hosting bật.',
      C: 'Triển khai AWS Shield Advanced và thêm ALB làm protected resource.',
      D: 'Tạo ALB mới định tuyến traffic tới Amazon EC2 instance chạy firewall bên thứ ba, rồi chuyển traffic tới ALB hiện tại.',
    },
  },
  214: {
    questionVi:
      'Hệ thống báo cáo của công ty gửi hàng trăm tệp .csv mỗi ngày tới Amazon S3 bucket. Công ty phải chuyển các tệp này sang định dạng Apache Parquet và lưu vào transformed data bucket. Giải pháp nào đáp ứng với công sức phát triển THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo Amazon EMR cluster cài Apache Spark. Viết Spark application chuyển đổi dữ liệu. Dùng EMR File System (EMRFS) ghi tệp vào transformed data bucket.',
      B: 'Tạo AWS Glue crawler khám phá dữ liệu. Tạo AWS Glue extract, transform, and load (ETL) job chuyển đổi dữ liệu. Chỉ định transformed data bucket ở bước output.',
      C: 'Dùng AWS Batch tạo job definition với Bash syntax chuyển đổi dữ liệu và ghi vào transformed data bucket. Dùng job definition submit job. Chỉ định array job làm job type.',
      D: 'Tạo AWS Lambda function chuyển đổi dữ liệu và ghi vào transformed data bucket. Cấu hình event notification cho S3 bucket. Chỉ định Lambda function làm destination cho event notification.',
    },
  },
  215: {
    questionVi:
      'Một công ty có 700 TB dữ liệu backup lưu trong network attached storage (NAS) tại data center. Dữ liệu backup cần truy cập không thường xuyên cho yêu cầu quy định và phải giữ 7 năm. Công ty quyết định migrate dữ liệu backup từ data center lên AWS. Migration phải hoàn tất trong 1 tháng. Công ty có 500 Mbps băng thông internet công cộng dành riêng cho chuyển dữ liệu. Kiến trúc sư giải pháp nên làm gì để migrate và lưu trữ dữ liệu với chi phí THẤP NHẤT?',
    optionsVi: {
      A: 'Đặt AWS Snowball devices chuyển dữ liệu. Dùng lifecycle policy chuyển tệp sang Amazon S3 Glacier Deep Archive.',
      B: 'Triển khai VPN connection giữa data center và Amazon VPC. Dùng AWS CLI copy dữ liệu từ on-premises lên Amazon S3 Glacier.',
      C: 'Cấp phát kết nối AWS Direct Connect 500 Mbps và chuyển dữ liệu lên Amazon S3. Dùng lifecycle policy chuyển tệp sang Amazon S3 Glacier Deep Archive.',
      D: 'Dùng AWS DataSync chuyển dữ liệu và triển khai DataSync agent on-premises. Dùng DataSync task copy tệp từ NAS on-premises sang Amazon S3 Glacier.',
    },
  },
  216: {
    questionVi:
      'Một công ty có website serverless với hàng triệu object trong Amazon S3 bucket. Công ty dùng S3 bucket làm origin cho Amazon CloudFront distribution. Công ty chưa bật mã hóa trên S3 bucket trước khi nạp object. Kiến trúc sư giải pháp cần bật mã hóa cho tất cả object hiện có và object thêm vào S3 bucket trong tương lai. Giải pháp nào đáp ứng với công sức THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo S3 bucket mới. Bật default encryption cho S3 bucket mới. Tải toàn bộ object hiện có về lưu trữ tạm local. Upload object lên S3 bucket mới.',
      B: 'Bật default encryption cho S3 bucket. Dùng S3 Inventory tạo tệp .csv liệt kê object chưa mã hóa. Chạy S3 Batch Operations job dùng lệnh copy để mã hóa các object đó.',
      C: 'Tạo encryption key bằng AWS Key Management Service (AWS KMS). Đổi cấu hình S3 bucket dùng server-side encryption với AWS KMS managed encryption keys (SSE-KMS). Bật versioning cho S3 bucket.',
      D: 'Điều hướng tới Amazon S3 trong AWS Management Console. Duyệt object của S3 bucket. Sắp xếp theo trường encryption. Chọn từng object chưa mã hóa. Dùng nút Modify áp dụng default encryption cho mọi object chưa mã hóa trong S3 bucket.',
    },
  },
  217: {
    questionVi:
      'Một công ty chạy ứng dụng web toàn cầu trên Amazon EC2 instances phía sau Application Load Balancer. Ứng dụng lưu dữ liệu trong Amazon Aurora. Công ty cần giải pháp disaster recovery, chấp nhận tối đa 30 phút downtime và mất dữ liệu tiềm ẩn. Giải pháp không cần xử lý tải khi hạ tầng primary còn khỏe mạnh. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Triển khai ứng dụng với hạ tầng cần thiết. Dùng Amazon Route 53 cấu hình active-passive failover. Tạo Aurora Replica ở AWS Region thứ hai.',
      B: 'Host triển khai thu nhỏ ứng dụng ở AWS Region thứ hai. Dùng Amazon Route 53 cấu hình active-active failover. Tạo Aurora Replica ở Region thứ hai.',
      C: 'Nhân bản hạ tầng primary ở AWS Region thứ hai. Dùng Amazon Route 53 cấu hình active-active failover. Tạo Aurora database khôi phục từ snapshot mới nhất.',
      D: 'Backup dữ liệu bằng AWS Backup. Dùng backup tạo hạ tầng cần thiết ở AWS Region thứ hai. Dùng Amazon Route 53 cấu hình active-passive failover. Tạo Aurora second primary instance ở Region thứ hai.',
    },
  },
  218: {
    questionVi:
      'Một công ty có web server chạy trên Amazon EC2 instance trong public subnet với Elastic IP address. Security group mặc định được gán cho EC2 instance. Network ACL mặc định đã bị sửa để chặn toàn bộ traffic. Kiến trúc sư giải pháp cần cho web server truy cập được từ mọi nơi trên cổng 443. Kiến trúc sư giải pháp nên kết hợp bước nào? (Chọn hai.)',
    optionsVi: {
      A: 'Tạo security group với rule cho phép TCP port 443 từ source 0.0.0.0/0.',
      B: 'Tạo security group với rule cho phép TCP port 443 tới destination 0.0.0.0/0.',
      C: 'Cập nhật network ACL cho phép TCP port 443 từ source 0.0.0.0/0.',
      D: 'Cập nhật network ACL cho phép inbound/outbound TCP port 443 từ source 0.0.0.0/0 và tới destination 0.0.0.0/0.',
      E: 'Cập nhật network ACL cho phép inbound TCP port 443 từ source 0.0.0.0/0 và outbound TCP port 32768-65535 tới destination 0.0.0.0/0.',
    },
  },
  219: {
    questionVi:
      'Ứng dụng của công ty gặp vấn đề hiệu năng. Ứng dụng stateful và cần hoàn thành tác vụ in-memory trên Amazon EC2 instances. Công ty triển khai hạ tầng bằng AWS CloudFormation và dùng họ EC2 instance M5. Khi traffic tăng, hiệu năng ứng dụng giảm. Người dùng báo chậm trễ khi truy cập ứng dụng. Giải pháp nào giải quyết vấn đề theo cách HIỆU QUẢ VẬN HÀNH NHẤT?',
    optionsVi: {
      A: 'Thay EC2 instances bằng T3 EC2 instances chạy trong Auto Scaling group. Thực hiện thay đổi qua AWS Management Console.',
      B: 'Sửa CloudFormation templates để chạy EC2 instances trong Auto Scaling group. Tăng desired capacity và maximum capacity của Auto Scaling group thủ công khi cần.',
      C: 'Sửa CloudFormation templates. Thay EC2 instances bằng R5 EC2 instances. Dùng EC2 memory metrics tích hợp Amazon CloudWatch theo dõi hiệu năng ứng dụng cho capacity planning.',
      D: 'Sửa CloudFormation templates. Thay EC2 instances bằng R5 EC2 instances. Triển khai Amazon CloudWatch agent trên EC2 instances tạo custom application latency metrics cho capacity planning.',
    },
  },
  220: {
    questionVi:
      'Một kiến trúc sư giải pháp thiết kế API mới dùng Amazon API Gateway nhận yêu cầu từ người dùng. Lượng yêu cầu biến động mạnh; có thể nhiều giờ không nhận yêu cầu nào. Xử lý dữ liệu diễn ra bất đồng bộ nhưng phải hoàn tất trong vài giây sau khi có yêu cầu. Kiến trúc sư giải pháp nên cho API gọi dịch vụ compute nào để đáp ứng yêu cầu với chi phí THẤP NHẤT?',
    optionsVi: {
      A: 'AWS Glue job',
      B: 'AWS Lambda function',
      C: 'Dịch vụ containerized host trên Amazon Elastic Kubernetes Service (Amazon EKS)',
      D: 'Dịch vụ containerized host trên Amazon ECS với Amazon EC2',
    },
  },
  221: {
    questionVi:
      'Một công ty chạy ứng dụng trên nhóm Amazon Linux EC2 instances. Vì lý do tuân thủ, công ty phải giữ toàn bộ application log files trong 7 năm. Log files sẽ được công cụ báo cáo phân tích, công cụ phải truy cập đồng thời tất cả tệp. Giải pháp lưu trữ nào đáp ứng TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Amazon Elastic Block Store (Amazon EBS)',
      B: 'Amazon Elastic File System (Amazon EFS)',
      C: 'Amazon EC2 instance store',
      D: 'Amazon S3',
    },
  },
  222: {
    questionVi:
      'Một công ty thuê vendor bên ngoài thực hiện công việc trong tài khoản AWS của công ty. Vendor dùng công cụ tự động host trong tài khoản AWS do vendor sở hữu. Vendor không có quyền IAM truy cập tài khoản AWS của công ty. Kiến trúc sư giải pháp nên cấp quyền truy cập cho vendor như thế nào?',
    optionsVi: {
      A: 'Tạo IAM role trong tài khoản công ty để ủy quyền truy cập cho IAM role của vendor. Gắn IAM policies phù hợp cho role theo quyền vendor cần.',
      B: 'Tạo IAM user trong tài khoản công ty với mật khẩu đáp ứng yêu cầu độ phức tạp. Gắn IAM policies phù hợp cho user theo quyền vendor cần.',
      C: 'Tạo IAM group trong tài khoản công ty. Thêm IAM user của công cụ từ tài khoản vendor vào group. Gắn IAM policies phù hợp cho group theo quyền vendor cần.',
      D: 'Tạo identity provider mới chọn loại "AWS account" trong IAM console. Cung cấp AWS account ID và user name của vendor. Gắn IAM policies phù hợp cho provider mới theo quyền vendor cần.',
    },
  },
  223: {
    questionVi:
      'Một công ty triển khai ứng dụng Java Spring Boot dạng pod chạy trên Amazon Elastic Kubernetes Service (Amazon EKS) trong private subnets. Ứng dụng cần ghi dữ liệu vào bảng Amazon DynamoDB. Kiến trúc sư giải pháp phải đảm bảo ứng dụng tương tác DynamoDB mà không expose traffic ra internet. Kiến trúc sư giải pháp nên kết hợp bước nào? (Chọn hai.)',
    optionsVi: {
      A: 'Gắn IAM role có đủ quyền cho EKS pod.',
      B: 'Gắn IAM user có đủ quyền cho EKS pod.',
      C: 'Cho phép outbound connectivity tới DynamoDB table qua network ACLs của private subnets.',
      D: 'Tạo VPC endpoint cho DynamoDB.',
      E: 'Nhúng access keys trong code Java Spring Boot.',
    },
  },
  224: {
    questionVi:
      'Một công ty gần đây migrate ứng dụng web lên AWS bằng cách tái lưu trữ trên Amazon EC2 instances trong một AWS Region. Công ty muốn thiết kế lại kiến trúc ứng dụng để có tính sẵn sàng cao và chịu lỗi. Traffic phải tới tất cả EC2 instances đang chạy một cách ngẫu nhiên. Công ty nên kết hợp bước nào? (Chọn hai.)',
    optionsVi: {
      A: 'Tạo Amazon Route 53 failover routing policy.',
      B: 'Tạo Amazon Route 53 weighted routing policy.',
      C: 'Tạo Amazon Route 53 multivalue answer routing policy.',
      D: 'Khởi chạy ba EC2 instances: hai instances trong một Availability Zone và một instance ở Availability Zone khác.',
      E: 'Khởi chạy bốn EC2 instances: hai instances trong một Availability Zone và hai instances ở Availability Zone khác.',
    },
  },
  225: {
    questionVi:
      'Một công ty truyền thông thu thập và phân tích dữ liệu hoạt động người dùng on-premises. Công ty muốn migrate khả năng này lên AWS. Kho dữ liệu hoạt động người dùng sẽ tiếp tục tăng và đạt petabyte. Công ty cần xây dựng giải pháp thu thập dữ liệu có tính sẵn sàng cao, hỗ trợ phân tích theo nhu cầu dữ liệu hiện có và mới bằng SQL. Giải pháp nào đáp ứng với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Gửi activity data tới Amazon Kinesis data stream. Cấu hình stream gửi dữ liệu tới Amazon S3 bucket.',
      B: 'Gửi activity data tới Amazon Kinesis Data Firehose delivery stream. Cấu hình stream gửi dữ liệu tới Amazon Redshift cluster.',
      C: 'Đặt activity data trong Amazon S3 bucket. Cấu hình Amazon S3 chạy AWS Lambda function trên dữ liệu khi dữ liệu đến S3 bucket.',
      D: 'Tạo ingestion service trên Amazon EC2 instances trải trên nhiều Availability Zones. Cấu hình service chuyển tiếp dữ liệu tới Amazon RDS Multi-AZ database.',
    },
  },
  226: {
    questionVi:
      'Một công ty thu thập dữ liệu từ hàng nghìn thiết bị từ xa bằng ứng dụng web services RESTful chạy trên Amazon EC2 instance. EC2 instance nhận raw data, chuyển đổi raw data và lưu toàn bộ dữ liệu vào Amazon S3 bucket. Số thiết bị từ xa sẽ tăng lên hàng triệu. Công ty cần giải pháp có khả năng mở rộng cao, giảm tối đa chi phí vận hành. Kiến trúc sư giải pháp nên kết hợp bước nào? (Chọn hai.)',
    optionsVi: {
      A: 'Dùng AWS Glue xử lý raw data trong Amazon S3.',
      B: 'Dùng Amazon Route 53 định tuyến traffic tới các EC2 instances khác nhau.',
      C: 'Thêm EC2 instances để đáp ứng lượng dữ liệu đến tăng.',
      D: 'Gửi raw data tới Amazon Simple Queue Service (Amazon SQS). Dùng EC2 instances xử lý dữ liệu.',
      E: 'Dùng Amazon API Gateway gửi raw data tới Amazon Kinesis data stream. Cấu hình Amazon Kinesis Data Firehose dùng data stream làm nguồn gửi dữ liệu tới Amazon S3.',
    },
  },
  227: {
    questionVi:
      'Một công ty cần giữ AWS CloudTrail logs trong 3 năm. Công ty bắt buộc CloudTrail trên tập hợp tài khoản AWS bằng AWS Organizations từ tài khoản parent. S3 bucket đích CloudTrail được cấu hình bật S3 Versioning. S3 Lifecycle policy đang xóa current objects sau 3 năm. Sau năm thứ tư sử dụng S3 bucket, metrics cho thấy số object vẫn tăng. Tuy nhiên, số CloudTrail logs mới gửi tới S3 bucket vẫn ổn định. Giải pháp nào xóa object cũ hơn 3 năm theo cách TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Cấu hình CloudTrail tập trung của organization để hết hạn object sau 3 năm.',
      B: 'Cấu hình S3 Lifecycle policy xóa cả previous versions và current versions.',
      C: 'Tạo AWS Lambda function liệt kê và xóa object từ Amazon S3 cũ hơn 3 năm.',
      D: 'Cấu hình tài khoản parent làm owner của tất cả object gửi tới S3 bucket.',
    },
  },
  228: {
    questionVi:
      'Một công ty có API nhận dữ liệu thời gian thực từ đội thiết bị giám sát. API lưu dữ liệu vào Amazon RDS DB instance để phân tích sau. Lượng dữ liệu thiết bị gửi tới API dao động. Trong giờ cao điểm, API thường trả timeout errors. Sau khi kiểm tra logs, công ty xác định database không xử lý được khối lượng write traffic từ API. Kiến trúc sư giải pháp phải giảm tối đa số kết nối tới database và đảm bảo không mất dữ liệu trong giờ cao điểm. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tăng kích thước DB instance lên loại instance có nhiều bộ nhớ hơn.',
      B: 'Sửa DB instance thành Multi-AZ DB instance. Cấu hình ứng dụng ghi vào tất cả RDS DB instances đang hoạt động.',
      C: 'Sửa API ghi dữ liệu đến vào Amazon Simple Queue Service (Amazon SQS) queue. Dùng AWS Lambda function do Amazon SQS gọi ghi dữ liệu từ queue vào database.',
      D: 'Sửa API ghi dữ liệu đến vào Amazon Simple Notification Service (Amazon SNS) topic. Dùng AWS Lambda function do Amazon SNS gọi ghi dữ liệu từ topic vào database.',
    },
  },
  229: {
    questionVi:
      'Một công ty tự quản lý Amazon EC2 instances chạy MySQL databases. Công ty đang quản lý replication và scaling thủ công khi nhu cầu tăng hoặc giảm. Công ty cần giải pháp mới đơn giản hóa việc thêm hoặc bớt compute capacity ở database tier khi cần. Giải pháp cũng phải cải thiện hiệu năng, scaling và độ bền với công sức vận hành tối thiểu. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Migrate databases sang Amazon Aurora Serverless for Aurora MySQL.',
      B: 'Migrate databases sang Amazon Aurora Serverless for Aurora PostgreSQL.',
      C: 'Gộp databases thành một MySQL database lớn hơn. Chạy database lớn hơn trên EC2 instances lớn hơn.',
      D: 'Tạo EC2 Auto Scaling group cho database tier. Migrate databases hiện có sang môi trường mới.',
    },
  },
  230: {
    questionVi:
      'Một công ty lo ngại hai NAT instances đang dùng sẽ không còn đủ hỗ trợ traffic ứng dụng. Kiến trúc sư giải pháp muốn triển khai giải pháp có tính sẵn sàng cao, chịu lỗi và tự động scale. Kiến trúc sư giải pháp nên đề xuất gì?',
    optionsVi: {
      A: 'Loại bỏ hai NAT instances và thay bằng hai NAT gateways trong cùng Availability Zone.',
      B: 'Dùng Auto Scaling groups với Network Load Balancers cho NAT instances ở các Availability Zones khác nhau.',
      C: 'Loại bỏ hai NAT instances và thay bằng hai NAT gateways ở các Availability Zones khác nhau.',
      D: 'Thay hai NAT instances bằng Spot Instances ở các Availability Zones khác nhau và triển khai Network Load Balancer.',
    },
  },
  231: {
    questionVi:
      'Một ứng dụng chạy trên Amazon EC2 instance có Elastic IP address trong VPC A. Ứng dụng cần truy cập database trong VPC B. Cả hai VPC trong cùng tài khoản AWS. Giải pháp nào cung cấp truy cập cần thiết AN TOÀN NHẤT?',
    optionsVi: {
      A: 'Tạo DB instance security group cho phép toàn bộ traffic từ public IP address của application server trong VPC A.',
      B: 'Cấu hình VPC peering connection giữa VPC A và VPC B.',
      C: 'Cho DB instance truy cập công khai. Gán public IP address cho DB instance.',
      D: 'Khởi chạy EC2 instance có Elastic IP address vào VPC B. Proxy mọi yêu cầu qua EC2 instance mới.',
    },
  },
  232: {
    questionVi:
      'Một công ty chạy môi trường demo cho khách hàng trên Amazon EC2 instances. Mỗi môi trường được cô lập trong VPC riêng. Đội vận hành cần được thông báo khi có truy cập RDP hoặc SSH vào môi trường.',
    optionsVi: {
      A: 'Cấu hình Amazon CloudWatch Application Insights tạo AWS Systems Manager OpsItems khi phát hiện truy cập RDP hoặc SSH.',
      B: 'Cấu hình EC2 instances với IAM instance profile có IAM role gắn policy AmazonSSMManagedInstanceCore.',
      C: 'Publish VPC flow logs lên Amazon CloudWatch Logs. Tạo metric filters cần thiết. Tạo Amazon CloudWatch metric alarm với notification action khi alarm ở trạng thái ALARM.',
      D: 'Cấu hình Amazon EventBridge rule lắng nghe sự kiện loại EC2 Instance State-change Notification. Cấu hình Amazon Simple Notification Service (Amazon SNS) topic làm target. Subscribe đội vận hành vào topic.',
    },
  },
  233: {
    questionVi:
      'Một kiến trúc sư giải pháp tạo tài khoản AWS mới và phải bảo mật quyền truy cập root user của tài khoản AWS. Kiến trúc sư giải pháp nên kết hợp hành động nào? (Chọn hai.)',
    optionsVi: {
      A: 'Đảm bảo root user dùng mật khẩu mạnh.',
      B: 'Bật multi-factor authentication cho root user.',
      C: 'Lưu root user access keys trong Amazon S3 bucket được mã hóa.',
      D: 'Thêm root user vào group có quyền quản trị.',
      E: 'Áp dụng quyền cần thiết cho root user bằng inline policy document.',
    },
  },
  234: {
    questionVi:
      'Một công ty xây dựng ứng dụng web quan hệ khách hàng (CRM) mới. Ứng dụng dùng nhiều Amazon EC2 instances được hỗ trợ bởi Amazon Elastic Block Store (Amazon EBS) volumes phía sau Application Load Balancer (ALB). Ứng dụng cũng dùng Amazon Aurora database. Toàn bộ dữ liệu ứng dụng phải được mã hóa khi lưu trữ (at rest) và khi truyền (in transit). Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng AWS Key Management Service (AWS KMS) certificates trên ALB để mã hóa dữ liệu in transit. Dùng AWS Certificate Manager (ACM) mã hóa EBS volumes và Aurora database storage at rest.',
      B: 'Dùng tài khoản AWS root đăng nhập AWS Management Console. Upload chứng chỉ mã hóa của công ty. Trong tài khoản root, chọn tùy chọn bật mã hóa toàn bộ dữ liệu at rest và in transit cho tài khoản.',
      C: 'Dùng AWS KMS mã hóa EBS volumes và Aurora database storage at rest. Gắn AWS Certificate Manager (ACM) certificate vào ALB để mã hóa dữ liệu in transit.',
      D: 'Dùng BitLocker mã hóa toàn bộ dữ liệu at rest. Import TLS certificate keys của công ty vào AWS Key Management Service (AWS KMS). Gắn KMS keys vào ALB để mã hóa dữ liệu in transit.',
    },
  },
  235: {
    questionVi:
      'Một công ty chuyển Oracle database on-premises sang Amazon Aurora PostgreSQL. Database có nhiều ứng dụng ghi vào cùng bảng. Ứng dụng cần migrate từng ứng dụng một, cách nhau một tháng. Ban quản lý lo ngại database có lượng read và write cao. Dữ liệu phải đồng bộ giữa hai database trong suốt quá trình migration. Kiến trúc sư giải pháp nên đề xuất gì?',
    optionsVi: {
      A: 'Dùng AWS DataSync cho migration ban đầu. Dùng AWS Database Migration Service (AWS DMS) tạo change data capture (CDC) replication task và table mapping chọn tất cả bảng.',
      B: 'Dùng AWS DataSync cho migration ban đầu. Dùng AWS DMS tạo full load plus change data capture (CDC) replication task và table mapping chọn tất cả bảng.',
      C: 'Dùng AWS Schema Conversion Tool với AWS DMS dùng memory optimized replication instance. Tạo full load plus change data capture (CDC) replication task và table mapping chọn tất cả bảng.',
      D: 'Dùng AWS Schema Conversion Tool với AWS DMS dùng compute optimized replication instance. Tạo full load plus change data capture (CDC) replication task và table mapping chọn các bảng lớn nhất.',
    },
  },
  236: {
    questionVi:
      'Một công ty có ứng dụng chia sẻ ảnh ba tầng. Ứng dụng dùng Amazon EC2 instance cho front-end layer, EC2 instance khác cho application layer và EC2 instance thứ ba cho MySQL database. Kiến trúc sư giải pháp phải thiết kế giải pháp có khả năng mở rộng và tính sẵn sàng cao, yêu cầu thay đổi ứng dụng tối thiểu. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng Amazon S3 host front-end layer. Dùng AWS Lambda functions cho application layer. Chuyển database sang Amazon DynamoDB table. Dùng Amazon S3 lưu trữ và phục vụ ảnh người dùng.',
      B: 'Dùng môi trường AWS Elastic Beanstalk Multi-AZ có cân bằng tải cho front-end layer và application layer. Chuyển database sang Amazon RDS DB instance với nhiều read replicas phục vụ ảnh người dùng.',
      C: 'Dùng Amazon S3 host front-end layer. Dùng fleet EC2 instances trong Auto Scaling group cho application layer. Chuyển database sang loại instance tối ưu bộ nhớ để lưu trữ và phục vụ ảnh người dùng.',
      D: 'Dùng môi trường AWS Elastic Beanstalk Multi-AZ có cân bằng tải cho front-end layer và application layer. Chuyển database sang Amazon RDS Multi-AZ DB instance. Dùng Amazon S3 lưu trữ và phục vụ ảnh người dùng.',
    },
  },
};

const out = writeBatch(8, 212, 236, T);
console.log('Wrote', out);
