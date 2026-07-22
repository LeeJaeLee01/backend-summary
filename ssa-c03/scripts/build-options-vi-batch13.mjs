#!/usr/bin/env node
import { writeBatch } from './build-options-vi-batches.mjs';

const T = {
  337: {
    questionVi:
      'Một công ty đã triển khai ứng dụng web trên AWS. Công ty host backend database trên Amazon RDS for MySQL với một DB instance chính và năm read replicas để hỗ trợ nhu cầu mở rộng. Read replicas không được lag quá 1 giây so với DB instance chính. Database thường xuyên chạy stored procedures theo lịch. Khi traffic website tăng, các replica gặp thêm lag trong giờ cao điểm. Kiến trúc sư giải pháp phải giảm replication lag càng nhiều càng tốt. Kiến trúc sư giải pháp phải giảm tối thiểu thay đổi mã ứng dụng và giảm tối thiểu công sức vận hành liên tục. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Migrate database sang Amazon Aurora MySQL. Thay read replicas bằng Aurora Replicas, và cấu hình Aurora Auto Scaling. Thay stored procedures bằng các hàm native của Aurora MySQL.',
      B: 'Triển khai Amazon ElastiCache for Redis cluster đặt trước database. Sửa ứng dụng để kiểm tra cache trước khi ứng dụng truy vấn database. Thay stored procedures bằng AWS Lambda functions.',
      C: 'Migrate database sang MySQL database chạy trên Amazon EC2 instances. Chọn EC2 instances lớn, tối ưu compute cho tất cả replica node. Duy trì stored procedures trên EC2 instances.',
      D: 'Migrate database sang Amazon DynamoDB. Cấp phát số lượng lớn read capacity units (RCUs) để hỗ trợ throughput cần thiết, và cấu hình on-demand capacity scaling. Thay stored procedures bằng DynamoDB streams.',
    },
  },
  338: {
    questionVi:
      'Kiến trúc sư giải pháp phải tạo kế hoạch disaster recovery (DR) cho nền tảng software as a service (SaaS) khối lượng lớn. Toàn bộ dữ liệu của nền tảng được lưu trong Amazon Aurora MySQL DB cluster. Kế hoạch DR phải sao chép dữ liệu sang AWS Region phụ. Giải pháp nào đáp ứng các yêu cầu này TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng MySQL binary log replication tới Aurora cluster ở Region phụ. Cấp phát một DB instance cho Aurora cluster ở Region phụ.',
      B: 'Thiết lập Aurora global database cho DB cluster. Sau khi thiết lập hoàn tất, loại bỏ DB instance khỏi Region phụ.',
      C: 'Dùng AWS Database Migration Service (AWS DMS) để liên tục sao chép dữ liệu tới Aurora cluster ở Region phụ. Loại bỏ DB instance khỏi Region phụ.',
      D: 'Thiết lập Aurora global database cho DB cluster. Chỉ định tối thiểu một DB instance ở Region phụ.',
    },
  },
  339: {
    questionVi:
      'Một công ty có ứng dụng tùy chỉnh với thông tin đăng nhập được nhúng trực tiếp trong code để truy xuất thông tin từ Amazon RDS MySQL DB instance. Ban quản lý yêu cầu ứng dụng phải được bảo mật hơn với ít công sức lập trình nhất. Kiến trúc sư giải pháp nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng AWS Key Management Service (AWS KMS) để tạo key. Cấu hình ứng dụng nạp thông tin đăng nhập database từ AWS KMS. Bật automatic key rotation.',
      B: 'Tạo thông tin đăng nhập trên RDS for MySQL database cho application user và lưu thông tin đăng nhập trong AWS Secrets Manager. Cấu hình ứng dụng nạp thông tin đăng nhập database từ Secrets Manager. Tạo AWS Lambda function xoay vòng thông tin đăng nhập trong Secrets Manager.',
      C: 'Tạo thông tin đăng nhập trên RDS for MySQL database cho application user và lưu thông tin đăng nhập trong AWS Secrets Manager. Cấu hình ứng dụng nạp thông tin đăng nhập database từ Secrets Manager. Thiết lập lịch xoay vòng thông tin đăng nhập cho application user trên RDS for MySQL database bằng Secrets Manager.',
      D: 'Tạo thông tin đăng nhập trên RDS for MySQL database cho application user và lưu thông tin đăng nhập trong AWS Systems Manager Parameter Store. Cấu hình ứng dụng nạp thông tin đăng nhập database từ Parameter Store. Thiết lập lịch xoay vòng thông tin đăng nhập cho application user trên RDS for MySQL database bằng Parameter Store.',
    },
  },
  340: {
    questionVi:
      'Một công ty truyền thông host website trên AWS. Kiến trúc ứng dụng website gồm nhóm Amazon EC2 instances phía sau Application Load Balancer (ALB) và database được host trên Amazon Aurora. Đội cybersecurity của công ty báo cáo ứng dụng dễ bị tấn công SQL injection. Công ty nên giải quyết vấn đề này như thế nào?',
    optionsVi: {
      A: 'Dùng AWS WAF đặt trước ALB. Liên kết web ACLs phù hợp với AWS WAF.',
      B: 'Tạo ALB listener rule để trả lời các cuộc tấn công SQL injection bằng fixed response.',
      C: 'Đăng ký AWS Shield Advanced để tự động chặn mọi tấn công SQL injection.',
      D: 'Thiết lập Amazon Inspector để tự động chặn mọi tấn công SQL injection.',
    },
  },
  341: {
    questionVi:
      'Một công ty có S3 data lake được quản lý bởi AWS Lake Formation. Công ty muốn tạo visualization trong Amazon QuickSight bằng cách join dữ liệu trong data lake với dữ liệu vận hành được lưu trong Amazon Aurora MySQL database. Công ty muốn thực thi phân quyền cấp cột (column-level authorization) để đội marketing của công ty chỉ truy cập được một phần cột trong database. Giải pháp nào đáp ứng các yêu cầu này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon EMR để nạp dữ liệu trực tiếp từ database vào QuickSight SPICE engine. Chỉ bao gồm các cột cần thiết.',
      B: 'Dùng AWS Glue Studio để nạp dữ liệu từ database vào S3 data lake. Gắn IAM policy vào QuickSight users để thực thi kiểm soát truy cập cấp cột. Dùng Amazon S3 làm data source trong QuickSight.',
      C: 'Dùng AWS Glue Elastic Views để tạo materialized view cho database trong Amazon S3. Tạo S3 bucket policy để thực thi kiểm soát truy cập cấp cột cho QuickSight users. Dùng Amazon S3 làm data source trong QuickSight.',
      D: 'Dùng Lake Formation blueprint để nạp dữ liệu từ database vào S3 data lake. Dùng Lake Formation để thực thi kiểm soát truy cập cấp cột cho QuickSight users. Dùng Amazon Athena làm data source trong QuickSight.',
    },
  },
  342: {
    questionVi:
      'Một công ty xử lý giao dịch có batch job scripted chạy hằng tuần trên Amazon EC2 instances. EC2 instances nằm trong Auto Scaling group. Số lượng giao dịch có thể thay đổi, nhưng CPU utilization baseline ghi nhận ở mỗi lần chạy tối thiểu là 60%. Công ty cần cấp phát capacity 30 phút trước khi job chạy. Hiện tại, kỹ sư thực hiện việc này bằng cách sửa thủ công các tham số của Auto Scaling group. Công ty không có nguồn lực để phân tích xu hướng capacity cần thiết cho số lượng Auto Scaling group. Công ty cần cách tự động để sửa desired capacity của Auto Scaling group. Giải pháp nào đáp ứng các yêu cầu này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo dynamic scaling policy cho Auto Scaling group. Cấu hình policy scale dựa trên metric CPU utilization. Đặt target value cho metric là 60%.',
      B: 'Tạo scheduled scaling policy cho Auto Scaling group. Đặt desired capacity, minimum capacity và maximum capacity phù hợp. Đặt recurrence hằng tuần. Đặt start time 30 phút trước khi batch job chạy.',
      C: 'Tạo predictive scaling policy cho Auto Scaling group. Cấu hình policy scale dựa trên forecast. Đặt scaling metric là CPU utilization. Đặt target value cho metric là 60%. Trong policy, đặt instance pre-launch 30 phút trước khi job chạy.',
      D: 'Tạo Amazon EventBridge event để gọi AWS Lambda function khi giá trị metric CPU utilization của Auto Scaling group đạt 60%. Cấu hình Lambda function tăng desired capacity và maximum capacity của Auto Scaling group lên 20%.',
    },
  },
  343: {
    questionVi:
      'Một kiến trúc sư giải pháp đang thiết kế kiến trúc disaster recovery (DR) cho một công ty. Công ty có MySQL database chạy trên Amazon EC2 instance trong private subnet với backup theo lịch. Thiết kế DR cần bao gồm nhiều AWS Regions. Giải pháp nào đáp ứng các yêu cầu này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Migrate MySQL database sang nhiều EC2 instances. Cấu hình standby EC2 instance ở Region DR. Bật replication.',
      B: 'Migrate MySQL database sang Amazon RDS. Dùng Multi-AZ deployment. Bật read replication cho primary DB instance ở các Availability Zone khác nhau.',
      C: 'Migrate MySQL database sang Amazon Aurora global database. Host primary DB cluster ở Region chính. Host secondary DB cluster ở Region DR.',
      D: 'Lưu backup theo lịch của MySQL database trong Amazon S3 bucket được cấu hình S3 Cross-Region Replication (CRR). Dùng data backup để khôi phục database ở Region DR.',
    },
  },
  344: {
    questionVi:
      'Một công ty có ứng dụng Java dùng Amazon Simple Queue Service (Amazon SQS) để parse message. Ứng dụng không thể parse các message lớn hơn 256 KB. Công ty muốn triển khai giải pháp giúp ứng dụng có khả năng parse message lớn tới 50 MB. Giải pháp nào đáp ứng các yêu cầu này với ÍT THAY ĐỔI CODE NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon SQS Extended Client Library for Java để lưu các message lớn hơn 256 KB trong Amazon S3.',
      B: 'Dùng Amazon EventBridge để post các message lớn từ ứng dụng thay cho Amazon SQS.',
      C: 'Đổi giới hạn trong Amazon SQS để xử lý message lớn hơn 256 KB.',
      D: 'Lưu các message lớn hơn 256 KB trong Amazon Elastic File System (Amazon EFS). Cấu hình Amazon SQS để tham chiếu tới vị trí này trong message.',
    },
  },
  345: {
    questionVi:
      'Một công ty muốn giới hạn quyền truy cập nội dung của một trong các ứng dụng web chính và bảo vệ nội dung bằng các kỹ thuật ủy quyền có sẵn trên AWS. Công ty muốn triển khai kiến trúc serverless và giải pháp xác thực cho dưới 100 người dùng. Giải pháp cần tích hợp với ứng dụng web chính và phục vụ nội dung web trên toàn cầu. Giải pháp cũng phải scale khi số người dùng của công ty tăng lên, đồng thời cung cấp độ trễ đăng nhập thấp nhất có thể. Giải pháp nào đáp ứng các yêu cầu này TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon Cognito để xác thực. Dùng Lambda@Edge để ủy quyền. Dùng Amazon CloudFront để phục vụ ứng dụng web trên toàn cầu.',
      B: 'Dùng AWS Directory Service for Microsoft Active Directory để xác thực. Dùng AWS Lambda để ủy quyền. Dùng Application Load Balancer để phục vụ ứng dụng web trên toàn cầu.',
      C: 'Dùng Amazon Cognito để xác thực. Dùng AWS Lambda để ủy quyền. Dùng Amazon S3 Transfer Acceleration để phục vụ ứng dụng web trên toàn cầu.',
      D: 'Dùng AWS Directory Service for Microsoft Active Directory để xác thực. Dùng Lambda@Edge để ủy quyền. Dùng AWS Elastic Beanstalk để phục vụ ứng dụng web trên toàn cầu.',
    },
  },
  346: {
    questionVi:
      'Một công ty có network-attached storage (NAS) array cũ trong data center. NAS array cung cấp SMB shares và NFS shares cho các workstation client. Công ty không muốn mua NAS array mới. Công ty cũng không muốn chịu chi phí gia hạn hợp đồng hỗ trợ của NAS array. Một phần dữ liệu được truy cập thường xuyên, nhưng phần lớn dữ liệu không hoạt động. Kiến trúc sư giải pháp cần triển khai giải pháp migrate dữ liệu sang Amazon S3, dùng S3 Lifecycle policies, và duy trì cách trải nghiệm tương tự cho các workstation client. Kiến trúc sư giải pháp đã xác định AWS Storage Gateway là một phần của giải pháp. Kiến trúc sư giải pháp nên cấp phát loại storage gateway nào để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Volume Gateway',
      B: 'Tape Gateway',
      C: 'Amazon FSx File Gateway',
      D: 'Amazon S3 File Gateway',
    },
  },
  347: {
    questionVi:
      'Một công ty có ứng dụng chạy trên Amazon EC2 instances. Kiến trúc sư giải pháp đã chuẩn hóa công ty dùng một họ instance cụ thể và nhiều kích thước instance khác nhau dựa trên nhu cầu hiện tại của công ty. Công ty muốn tối đa hóa tiết kiệm chi phí cho ứng dụng trong 3 năm tới. Công ty cần có khả năng đổi họ instance và kích thước trong 6 tháng tới dựa trên độ phổ biến và mức sử dụng ứng dụng. Giải pháp nào đáp ứng các yêu cầu này TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Compute Savings Plan',
      B: 'EC2 Instance Savings Plan',
      C: 'Zonal Reserved Instances',
      D: 'Standard Reserved Instances',
    },
  },
  348: {
    questionVi:
      'Một công ty thu thập dữ liệu từ số lượng lớn người tham gia dùng thiết bị đeo (wearable devices). Công ty lưu dữ liệu trong bảng Amazon DynamoDB và dùng ứng dụng để phân tích dữ liệu. Workload dữ liệu ổn định và có thể dự đoán được. Công ty muốn duy trì ở mức bằng hoặc thấp hơn ngân sách dự báo cho DynamoDB. Giải pháp nào đáp ứng các yêu cầu này TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng provisioned mode và DynamoDB Standard-Infrequent Access (DynamoDB Standard-IA). Đặt reserved capacity cho workload dự báo.',
      B: 'Dùng provisioned mode. Chỉ định read capacity units (RCUs) và write capacity units (WCUs).',
      C: 'Dùng on-demand mode. Đặt read capacity units (RCUs) và write capacity units (WCUs) đủ cao để đáp ứng thay đổi trong workload.',
      D: 'Dùng on-demand mode. Chỉ định read capacity units (RCUs) và write capacity units (WCUs) với reserved capacity.',
    },
  },
  349: {
    questionVi:
      'Một công ty lưu dữ liệu bảo mật trong Amazon Aurora PostgreSQL database ở Region ap-southeast-3. Database được mã hóa bằng AWS Key Management Service (AWS KMS) customer managed key. Công ty vừa được mua lại và phải chia sẻ backup database một cách an toàn với tài khoản AWS của công ty mua lại ở ap-southeast-3. Kiến trúc sư giải pháp nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo database snapshot. Sao chép snapshot sang snapshot mới không mã hóa. Chia sẻ snapshot mới với tài khoản AWS của công ty mua lại.',
      B: 'Tạo database snapshot. Thêm tài khoản AWS của công ty mua lại vào KMS key policy. Chia sẻ snapshot với tài khoản AWS của công ty mua lại.',
      C: 'Tạo database snapshot dùng AWS managed KMS key khác. Thêm tài khoản AWS của công ty mua lại vào KMS key alias. Chia sẻ snapshot với tài khoản AWS của công ty mua lại.',
      D: 'Tạo database snapshot. Download database snapshot. Upload database snapshot lên Amazon S3 bucket. Cập nhật S3 bucket policy để cho phép truy cập từ tài khoản AWS của công ty mua lại.',
    },
  },
  350: {
    questionVi:
      'Một công ty dùng Amazon RDS for Microsoft SQL Server Single-AZ DB instance 100 GB ở Region us-east-1 để lưu giao dịch khách hàng. Công ty cần tính sẵn sàng cao và khôi phục tự động cho DB instance. Công ty cũng phải chạy báo cáo trên RDS database vài lần mỗi năm. Quy trình báo cáo khiến giao dịch mất nhiều thời gian hơn bình thường để ghi vào tài khoản khách hàng. Công ty cần giải pháp cải thiện hiệu năng của quy trình báo cáo. Kết hợp bước nào đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Sửa DB instance từ Single-AZ DB instance sang Multi-AZ deployment.',
      B: 'Chụp snapshot của DB instance hiện tại. Khôi phục snapshot vào RDS deployment mới ở Availability Zone khác.',
      C: 'Tạo read replica của DB instance ở Availability Zone khác. Định hướng toàn bộ request báo cáo tới read replica.',
      D: 'Migrate database sang RDS Custom.',
      E: 'Dùng RDS Proxy để giới hạn request báo cáo vào maintenance window.',
    },
  },
  351: {
    questionVi:
      'Một công ty đang migrate ứng dụng quản lý dữ liệu lên AWS. Công ty muốn chuyển sang kiến trúc event-driven. Kiến trúc cần phân tán hơn và dùng khái niệm serverless khi thực hiện các khía cạnh khác nhau của workflow. Công ty cũng muốn giảm tối thiểu công sức vận hành. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Xây dựng workflow trong AWS Glue. Dùng AWS Glue để gọi AWS Lambda functions xử lý các bước workflow.',
      B: 'Xây dựng workflow trong AWS Step Functions. Triển khai ứng dụng trên Amazon EC2 instances. Dùng Step Functions để gọi các bước workflow trên EC2 instances.',
      C: 'Xây dựng workflow trong Amazon EventBridge. Dùng EventBridge để gọi AWS Lambda functions theo lịch xử lý các bước workflow.',
      D: 'Xây dựng workflow trong AWS Step Functions. Dùng Step Functions để tạo state machine. Dùng state machine để gọi AWS Lambda functions xử lý các bước workflow.',
    },
  },
  352: {
    questionVi:
      'Một công ty đang thiết kế mạng cho một game online multiplayer. Game dùng networking protocol UDP và sẽ được triển khai ở tám AWS Regions. Kiến trúc mạng cần giảm thiểu độ trễ và mất packet để mang lại trải nghiệm chơi game chất lượng cao cho người dùng cuối. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Thiết lập transit gateway ở mỗi Region. Tạo inter-Region peering attachment giữa mỗi transit gateway.',
      B: 'Thiết lập AWS Global Accelerator với UDP listeners và endpoint groups ở mỗi Region.',
      C: 'Thiết lập Amazon CloudFront với UDP được bật. Cấu hình origin ở mỗi Region.',
      D: 'Thiết lập VPC peering mesh giữa mỗi Region. Bật UDP cho mỗi VPC.',
    },
  },
  353: {
    questionVi:
      'Một công ty host ứng dụng web ba tầng trên Amazon EC2 instances trong một Availability Zone duy nhất. Ứng dụng web dùng MySQL database tự quản lý được host trên EC2 instance để lưu dữ liệu vào Amazon Elastic Block Store (Amazon EBS) volume. MySQL database hiện dùng Provisioned IOPS SSD (io2) EBS volume 1 TB. Công ty dự đoán traffic 1.000 IOPS cho cả đọc và viết vào giờ cao điểm. Công ty muốn giảm tối thiểu gián đoạn, ổn định hiệu năng và giảm chi phí trong khi vẫn giữ khả năng gấp đôi IOPS. Công ty muốn chuyển tầng database sang giải pháp được quản lý toàn diện, có tính sẵn sàng cao và chịu lỗi. Giải pháp nào đáp ứng các yêu cầu này TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng Multi-AZ deployment của Amazon RDS for MySQL DB instance với io2 Block Express EBS volume.',
      B: 'Dùng Multi-AZ deployment của Amazon RDS for MySQL DB instance với General Purpose SSD (gp2) EBS volume.',
      C: 'Dùng Amazon S3 Intelligent-Tiering access tiers.',
      D: 'Dùng hai EC2 instances lớn để host database ở chế độ active-passive.',
    },
  },
  354: {
    questionVi:
      'Một công ty host ứng dụng serverless trên AWS. Ứng dụng dùng Amazon API Gateway, AWS Lambda và Amazon RDS for PostgreSQL database. Công ty nhận thấy sự gia tăng lỗi ứng dụng do timeout kết nối database trong giờ cao điểm hoặc traffic không thể đoán trước. Công ty cần giải pháp giảm lỗi ứng dụng với lượng thay đổi mã tối thiểu. Kiến trúc sư giải pháp nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Giảm concurrency rate của Lambda.',
      B: 'Bật RDS Proxy trên RDS DB instance.',
      C: 'Đổi kích thước RDS DB instance class để chấp nhận nhiều kết nối hơn.',
      D: 'Migrate database sang Amazon DynamoDB với on-demand scaling.',
    },
  },
  355: {
    questionVi:
      'Một công ty đang migrate ứng dụng cũ lên AWS. Ứng dụng chạy batch job mỗi giờ và cần nhiều CPU. Batch job trung bình mất 15 phút với server on-premises. Server có 64 virtual CPU (vCPU) và 512 GiB bộ nhớ. Giải pháp nào chạy batch job trong 15 phút với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Lambda với functional scaling.',
      B: 'Dùng Amazon Elastic Container Service (Amazon ECS) với AWS Fargate.',
      C: 'Dùng Amazon Lightsail với AWS Auto Scaling.',
      D: 'Dùng AWS Batch trên Amazon EC2.',
    },
  },
  356: {
    questionVi:
      'Một công ty lưu các object dữ liệu trong Amazon S3 Standard storage. Kiến trúc sư giải pháp phát hiện 75% dữ liệu ít được truy cập sau 30 ngày. Công ty cần toàn bộ dữ liệu vẫn sẵn sàng truy cập ngay lập tức với cùng tính sẵn sàng cao và độ bền, nhưng công ty muốn giảm tối thiểu chi phí lưu trữ. Giải pháp lưu trữ nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Chuyển các object dữ liệu sang S3 Glacier Deep Archive sau 30 ngày.',
      B: 'Chuyển các object dữ liệu sang S3 Standard-Infrequent Access (S3 Standard-IA) sau 30 ngày.',
      C: 'Chuyển các object dữ liệu sang S3 One Zone-Infrequent Access (S3 One Zone-IA) sau 30 ngày.',
      D: 'Chuyển các object dữ liệu sang S3 One Zone-Infrequent Access (S3 One Zone-IA) ngay lập tức.',
    },
  },
  357: {
    questionVi:
      'Một công ty gaming đang chuyển bảng xếp hạng công khai từ data center sang AWS Cloud. Công ty dùng Amazon EC2 Windows Server instances phía sau Application Load Balancer để host ứng dụng động. Công ty cần giải pháp lưu trữ có tính sẵn sàng cao cho ứng dụng. Ứng dụng gồm các tệp tĩnh và mã server-side động. Kết hợp bước nào kiến trúc sư giải pháp nên thực hiện để đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Lưu các tệp tĩnh trên Amazon S3. Dùng Amazon CloudFront để cache object tại edge.',
      B: 'Lưu các tệp tĩnh trên Amazon S3. Dùng Amazon ElastiCache để cache object tại edge.',
      C: 'Lưu mã server-side trên Amazon Elastic File System (Amazon EFS). Mount EFS volume trên mỗi EC2 instance để chia sẻ tệp.',
      D: 'Lưu mã server-side trên Amazon FSx for Windows File Server. Mount FSx for Windows File Server volume trên mỗi EC2 instance để chia sẻ tệp.',
      E: 'Lưu mã server-side trên General Purpose SSD (gp2) Amazon Elastic Block Store (Amazon EBS) volume. Mount EBS volume trên mỗi EC2 instance để chia sẻ tệp.',
    },
  },
  358: {
    questionVi:
      'Một công ty mạng xã hội chạy ứng dụng trên Amazon EC2 instances phía sau Application Load Balancer (ALB). ALB là origin cho Amazon CloudFront distribution. Ứng dụng có hơn một tỷ ảnh được lưu trong Amazon S3 bucket và xử lý hàng nghìn ảnh mỗi giây. Công ty muốn thay đổi kích thước ảnh động và phục vụ đúng định dạng cho client. Giải pháp nào đáp ứng các yêu cầu này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Cài thư viện quản lý ảnh bên thứ ba trên EC2 instance. Dùng thư viện quản lý ảnh để xử lý ảnh.',
      B: 'Tạo CloudFront origin request policy. Dùng policy để tự động resize ảnh và phục vụ định dạng phù hợp dựa trên header User-Agent HTTP trong request.',
      C: 'Dùng Lambda@Edge function với thư viện quản lý ảnh bên thứ ba. Liên kết Lambda@Edge function với các CloudFront behavior phục vụ ảnh.',
      D: 'Tạo CloudFront response headers policy. Dùng policy để tự động resize ảnh và phục vụ định dạng phù hợp dựa trên header User-Agent HTTP trong request.',
    },
  },
  359: {
    questionVi:
      'Một bệnh viện cần lưu hồ sơ bệnh nhân trong Amazon S3 bucket. Đội tuân thủ của bệnh viện phải đảm bảo toàn bộ protected health information (PHI) được mã hóa khi truyền (in transit) và khi lưu trữ (at rest). Đội tuân thủ phải quản lý encryption key cho dữ liệu at rest. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo public SSL/TLS certificate trong AWS Certificate Manager (ACM). Liên kết certificate với Amazon S3. Cấu hình default encryption cho mỗi S3 bucket dùng server-side encryption với AWS KMS keys (SSE-KMS). Giao đội tuân thủ quản lý KMS keys.',
      B: 'Dùng điều kiện aws:SecureTransport trong S3 bucket policies để chỉ cho phép kết nối mã hóa qua HTTPS (TLS). Cấu hình default encryption cho mỗi S3 bucket dùng server-side encryption với S3 managed encryption keys (SSE-S3). Giao đội tuân thủ quản lý SSE-S3 keys.',
      C: 'Dùng điều kiện aws:SecureTransport trong S3 bucket policies để chỉ cho phép kết nối mã hóa qua HTTPS (TLS). Cấu hình default encryption cho mỗi S3 bucket dùng server-side encryption với AWS KMS keys (SSE-KMS). Giao đội tuân thủ quản lý KMS keys.',
      D: 'Dùng điều kiện aws:SecureTransport trong S3 bucket policies để chỉ cho phép kết nối mã hóa qua HTTPS (TLS). Dùng Amazon Macie để bảo vệ dữ liệu nhạy cảm được lưu trong Amazon S3. Giao đội tuân thủ quản lý Macie.',
    },
  },
  360: {
    questionVi:
      'Một công ty dùng Amazon API Gateway để chạy một private gateway với hai REST APIs trong cùng VPC. BuyStock RESTful web service gọi CheckFunds RESTful web service để đảm bảo có đủ tiền trước khi mua cổ phiếu. Công ty phát hiện trong VPC flow logs rằng BuyStock RESTful web service gọi CheckFunds RESTful web service qua internet thay vì qua VPC. Kiến trúc sư giải pháp phải triển khai giải pháp để các API giao tiếp qua VPC. Giải pháp nào đáp ứng các yêu cầu này với ÍT THAY ĐỔI CODE NHẤT?',
    optionsVi: {
      A: 'Thêm header X-API-Key trong HTTP header để ủy quyền.',
      B: 'Dùng interface endpoint.',
      C: 'Dùng gateway endpoint.',
      D: 'Thêm Amazon Simple Queue Service (Amazon SQS) queue giữa hai REST APIs.',
    },
  },
  361: {
    questionVi:
      'Một công ty host ứng dụng gaming multiplayer trên AWS. Công ty muốn ứng dụng đọc dữ liệu với độ trễ dưới một milli giây và chạy các truy vấn một lần trên dữ liệu lịch sử. Giải pháp nào đáp ứng các yêu cầu này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon RDS cho dữ liệu được truy cập thường xuyên. Chạy script tùy chỉnh định kỳ để export dữ liệu sang Amazon S3 bucket.',
      B: 'Lưu dữ liệu trực tiếp trong Amazon S3 bucket. Triển khai S3 Lifecycle policy để chuyển dữ liệu cũ sang S3 Glacier Deep Archive để lưu trữ dài hạn. Chạy truy vấn một lần trên dữ liệu trong Amazon S3 bằng Amazon Athena.',
      C: 'Dùng Amazon DynamoDB với DynamoDB Accelerator (DAX) cho dữ liệu được truy cập thường xuyên. Export dữ liệu sang Amazon S3 bucket bằng DynamoDB table export. Chạy truy vấn một lần trên dữ liệu trong Amazon S3 bằng Amazon Athena.',
      D: 'Dùng Amazon DynamoDB cho dữ liệu được truy cập thường xuyên. Bật streaming tới Amazon Kinesis Data Streams. Dùng Amazon Kinesis Data Firehose để đọc dữ liệu từ Kinesis Data Streams. Lưu các bản ghi vào Amazon S3 bucket.',
    },
  },
};

const out = writeBatch(13, 337, 361, T);
console.log('Wrote', out);
