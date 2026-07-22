#!/usr/bin/env node
import { writeBatch } from './build-options-vi-batches.mjs';

const T = {
  237: {
    questionVi:
      'Ứng dụng chạy trên Amazon EC2 instance trong VPC-A cần truy cập tệp trên EC2 instance khác trong VPC-B. Cả hai VPC thuộc tài khoản AWS khác nhau. Quản trị viên mạng cần thiết kế giải pháp cấu hình truy cập an toàn tới EC2 instance trong VPC-B từ VPC-A. Kết nối không được có single point of failure hoặc lo ngại băng thông. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Thiết lập VPC peering connection giữa VPC-A và VPC-B.',
      B: 'Thiết lập VPC gateway endpoints cho EC2 instance chạy trong VPC-B.',
      C: 'Gắn virtual private gateway vào VPC-B và thiết lập routing từ VPC-A.',
      D: 'Tạo private virtual interface (VIF) cho EC2 instance chạy trong VPC-B và thêm routes phù hợp từ VPC-A.',
    },
  },
  238: {
    questionVi:
      'Một công ty muốn thử nghiệm với tài khoản AWS riêng cho đội kỹ sư. Công ty muốn được thông báo ngay khi mức sử dụng Amazon EC2 instance của tài khoản vượt ngưỡng cụ thể trong tháng. Kiến trúc sư giải pháp nên làm gì để đáp ứng yêu cầu TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng Cost Explorer tạo báo cáo chi phí hàng ngày theo dịch vụ. Lọc báo cáo theo EC2 instances. Cấu hình Cost Explorer gửi thông báo Amazon Simple Email Service (Amazon SES) khi vượt ngưỡng.',
      B: 'Dùng Cost Explorer tạo báo cáo chi phí hàng tháng theo dịch vụ. Lọc báo cáo theo EC2 instances. Cấu hình Cost Explorer gửi thông báo Amazon SES khi vượt ngưỡng.',
      C: 'Dùng AWS Budgets tạo cost budget cho từng tài khoản. Đặt chu kỳ hàng tháng. Đặt scope là EC2 instances. Đặt alert threshold cho budget. Cấu hình Amazon Simple Notification Service (Amazon SNS) topic nhận thông báo khi vượt ngưỡng.',
      D: 'Dùng AWS Cost and Usage Reports tạo báo cáo độ chi tiết theo giờ. Tích hợp dữ liệu báo cáo với Amazon Athena. Dùng Amazon EventBridge lên lịch truy vấn Athena. Cấu hình Amazon SNS topic nhận thông báo khi vượt ngưỡng.',
    },
  },
  239: {
    questionVi:
      'Kiến trúc sư giải pháp cần thiết kế microservice mới cho ứng dụng công ty. Client phải gọi HTTPS endpoint để truy cập microservice. Microservice cũng phải dùng AWS Identity and Access Management (IAM) để xác thực lời gọi. Kiến trúc sư giải pháp sẽ viết logic microservice bằng một AWS Lambda function duy nhất viết bằng Go 1.x. Giải pháp nào triển khai function theo cách HIỆU QUẢ VẬN HÀNH NHẤT?',
    optionsVi: {
      A: 'Tạo Amazon API Gateway REST API. Cấu hình method dùng Lambda function. Bật IAM authentication trên API.',
      B: 'Tạo Lambda function URL cho function. Chỉ định AWS_IAM làm authentication type.',
      C: 'Tạo Amazon CloudFront distribution. Triển khai function lên Lambda@Edge. Tích hợp logic IAM authentication vào Lambda@Edge function.',
      D: 'Tạo Amazon CloudFront distribution. Triển khai function lên CloudFront Functions. Chỉ định AWS_IAM làm authentication type.',
    },
  },
  240: {
    questionVi:
      'Một công ty trước đây đã migrate giải pháp data warehouse lên AWS. Công ty cũng có kết nối AWS Direct Connect. Người dùng văn phòng truy vấn data warehouse bằng công cụ trực quan hóa. Kích thước trung bình truy vấn data warehouse trả về là 50 MB và mỗi trang web công cụ trực quan hóa khoảng 500 KB. Result sets data warehouse trả về không được cache. Giải pháp nào cung cấp chi phí data transfer egress THẤP NHẤT cho công ty?',
    optionsVi: {
      A: 'Host công cụ trực quan hóa on-premises và truy vấn data warehouse trực tiếp qua internet.',
      B: 'Host công cụ trực quan hóa trong cùng AWS Region với data warehouse. Truy cập qua internet.',
      C: 'Host công cụ trực quan hóa on-premises và truy vấn data warehouse trực tiếp qua Direct Connect tại vị trí trong cùng AWS Region.',
      D: 'Host công cụ trực quan hóa trong cùng AWS Region với data warehouse và truy cập qua Direct Connect tại vị trí trong cùng Region.',
    },
  },
  241: {
    questionVi:
      'Một công ty học trực tuyến đang migrate lên AWS Cloud. Công ty lưu hồ sơ sinh viên trong PostgreSQL database. Công ty cần giải pháp dữ liệu luôn sẵn sàng và online trên nhiều AWS Regions. Giải pháp nào đáp ứng với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Migrate PostgreSQL database sang PostgreSQL cluster trên Amazon EC2 instances.',
      B: 'Migrate PostgreSQL database sang Amazon RDS for PostgreSQL DB instance bật tính năng Multi-AZ.',
      C: 'Migrate PostgreSQL database sang Amazon RDS for PostgreSQL DB instance. Tạo read replica ở Region khác.',
      D: 'Migrate PostgreSQL database sang Amazon RDS for PostgreSQL DB instance. Thiết lập DB snapshots được copy sang Region khác.',
    },
  },
  242: {
    questionVi:
      'Một công ty host ứng dụng web trên AWS bằng bảy Amazon EC2 instances. Công ty yêu cầu địa chỉ IP của tất cả EC2 instances khỏe mạnh được trả về khi truy vấn DNS. Công ty nên dùng policy nào?',
    optionsVi: {
      A: 'Simple routing policy',
      B: 'Latency routing policy',
      C: 'Multivalue routing policy',
      D: 'Geolocation routing policy',
    },
  },
  243: {
    questionVi:
      'Một phòng thí nghiệm nghiên cứu y tế tạo dữ liệu liên quan nghiên cứu mới. Phòng thí nghiệm muốn dữ liệu sẵn sàng với độ trễ tối thiểu cho các phòng khám trên toàn quốc dùng ứng dụng dựa trên tệp on-premises. Tệp dữ liệu lưu trong Amazon S3 bucket có quyền read-only cho từng phòng khám. Kiến trúc sư giải pháp nên đề xuất gì?',
    optionsVi: {
      A: 'Triển khai AWS Storage Gateway file gateway dạng virtual machine (VM) on-premises tại từng phòng khám.',
      B: 'Migrate tệp sang ứng dụng on-premises từng phòng khám bằng AWS DataSync để xử lý.',
      C: 'Triển khai AWS Storage Gateway volume gateway dạng virtual machine (VM) on-premises tại từng phòng khám.',
      D: 'Gắn Amazon Elastic File System (Amazon EFS) file system vào server on-premises từng phòng khám.',
    },
  },
  244: {
    questionVi:
      'Một công ty dùng hệ thống quản lý nội dung chạy trên một Amazon EC2 instance. EC2 instance chứa cả web server và database software. Công ty phải làm nền tảng website có tính sẵn sàng cao và cho phép website scale theo nhu cầu người dùng. Kiến trúc sư giải pháp nên đề xuất gì?',
    optionsVi: {
      A: 'Chuyển database sang Amazon RDS và bật automatic backups. Khởi chạy thủ công EC2 instance khác trong cùng Availability Zone. Cấu hình Application Load Balancer trong Availability Zone và đặt hai instances làm targets.',
      B: 'Migrate database sang Amazon Aurora instance có read replica trong cùng Availability Zone với EC2 instance hiện có. Khởi chạy thủ công EC2 instance khác trong cùng Availability Zone. Cấu hình Application Load Balancer và đặt hai EC2 instances làm targets.',
      C: 'Chuyển database sang Amazon Aurora với read replica ở Availability Zone khác. Tạo Amazon Machine Image (AMI) từ EC2 instance. Cấu hình Application Load Balancer trên hai Availability Zones. Gắn Auto Scaling group dùng AMI trên hai Availability Zones.',
      D: 'Chuyển database sang EC2 instance riêng và lên lịch backup sang Amazon S3. Tạo AMI từ EC2 instance gốc. Cấu hình Application Load Balancer trên hai Availability Zones. Gắn Auto Scaling group dùng AMI trên hai Availability Zones.',
    },
  },
  245: {
    questionVi:
      'Một công ty ra mắt ứng dụng trên AWS. Ứng dụng dùng Application Load Balancer (ALB) định tuyến traffic tới ít nhất hai Amazon EC2 instances trong một target group. Instances nằm trong Auto Scaling group cho từng môi trường. Công ty cần môi trường development và production. Môi trường production sẽ có giai đoạn traffic cao. Giải pháp nào cấu hình môi trường development TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Cấu hình lại target group trong môi trường development chỉ có một EC2 instance làm target.',
      B: 'Đổi thuật toán cân bằng tải ALB sang least outstanding requests.',
      C: 'Giảm kích thước EC2 instances ở cả hai môi trường.',
      D: 'Giảm số EC2 instances tối đa trong Auto Scaling group của môi trường development.',
    },
  },
  246: {
    questionVi:
      'Một công ty chạy ứng dụng web trên Amazon EC2 instances trong nhiều Availability Zones. EC2 instances ở private subnets. Kiến trúc sư giải pháp triển khai Application Load Balancer (ALB) hướng internet và chỉ định EC2 instances làm target group. Tuy nhiên, internet traffic không tới EC2 instances. Kiến trúc sư giải pháp nên cấu hình lại kiến trúc như thế nào?',
    optionsVi: {
      A: 'Thay ALB bằng Network Load Balancer. Cấu hình NAT gateway trong public subnet cho phép internet traffic.',
      B: 'Chuyển EC2 instances sang public subnets. Thêm rule vào security groups của EC2 instances cho phép outbound traffic tới 0.0.0.0/0.',
      C: 'Cập nhật route tables cho subnets của EC2 instances gửi traffic 0.0.0.0/0 qua internet gateway route. Thêm rule vào security groups của EC2 instances cho phép outbound traffic tới 0.0.0.0/0.',
      D: 'Tạo public subnets trong từng Availability Zone. Liên kết public subnets với ALB. Cập nhật route tables của public subnets có route tới private subnets.',
    },
  },
  247: {
    questionVi:
      'Một công ty đã triển khai database trong Amazon RDS for MySQL. Do giao dịch tăng, đội hỗ trợ database báo read chậm trên DB instance và đề xuất thêm read replica. Kiến trúc sư giải pháp nên kết hợp hành động nào trước khi triển khai thay đổi? (Chọn hai.)',
    optionsVi: {
      A: 'Bật binlog replication trên RDS primary node.',
      B: 'Chọn failover priority cho source DB instance.',
      C: 'Cho phép long-running transactions hoàn tất trên source DB instance.',
      D: 'Tạo global table và chỉ định AWS Regions bảng sẽ khả dụng.',
      E: 'Bật automatic backups trên source instance bằng cách đặt backup retention period khác 0.',
    },
  },
  248: {
    questionVi:
      'Một công ty chạy phần mềm phân tích trên Amazon EC2 instances. Phần mềm nhận job request từ người dùng xử lý dữ liệu đã upload lên Amazon S3. Người dùng báo một số dữ liệu gửi không được xử lý. Amazon CloudWatch cho thấy EC2 instances có CPU utilization ổn định ở hoặc gần 100%. Công ty muốn cải thiện hiệu năng hệ thống và scale theo tải người dùng. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Tạo bản sao instance. Đặt tất cả instances phía sau Application Load Balancer.',
      B: 'Tạo S3 VPC endpoint cho Amazon S3. Cập nhật phần mềm tham chiếu endpoint.',
      C: 'Dừng EC2 instances. Đổi instance type sang loại có CPU mạnh hơn và nhiều bộ nhớ hơn. Khởi động lại instances.',
      D: 'Định tuyến yêu cầu đến Amazon Simple Queue Service (Amazon SQS). Cấu hình EC2 Auto Scaling group theo kích thước queue. Cập nhật phần mềm đọc từ queue.',
    },
  },
  249: {
    questionVi:
      'Một công ty triển khai giải pháp lưu trữ dùng chung cho ứng dụng media host trên AWS Cloud. Công ty cần khả năng dùng SMB clients truy cập dữ liệu. Giải pháp phải được quản lý hoàn toàn. Giải pháp AWS nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo AWS Storage Gateway volume gateway. Tạo file share dùng giao thức client yêu cầu. Kết nối application server với file share.',
      B: 'Tạo AWS Storage Gateway tape gateway. Cấu hình tapes dùng Amazon S3. Kết nối application server với tape gateway.',
      C: 'Tạo Amazon EC2 Windows instance. Cài và cấu hình vai trò Windows file share trên instance. Kết nối application server với file share.',
      D: 'Tạo Amazon FSx for Windows File Server file system. Gắn file system vào origin server. Kết nối application server với file system.',
    },
  },
  250: {
    questionVi:
      'Đội bảo mật công ty yêu cầu ghi lại network traffic trong VPC Flow Logs. Logs sẽ được truy cập thường xuyên trong 90 ngày rồi truy cập không liên tục. Kiến trúc sư giải pháp nên làm gì khi cấu hình logs?',
    optionsVi: {
      A: 'Dùng Amazon CloudWatch làm target. Đặt CloudWatch log group hết hạn sau 90 ngày.',
      B: 'Dùng Amazon Kinesis làm target. Cấu hình Kinesis stream luôn giữ logs 90 ngày.',
      C: 'Dùng AWS CloudTrail làm target. Cấu hình CloudTrail lưu vào Amazon S3 bucket và bật S3 Intelligent-Tiering.',
      D: 'Dùng Amazon S3 làm target. Bật S3 Lifecycle policy chuyển logs sang S3 Standard-Infrequent Access (S3 Standard-IA) sau 90 ngày.',
    },
  },
  251: {
    questionVi:
      'Amazon EC2 instance nằm trong private subnet của VPC mới. Subnet này không có outbound internet access, nhưng EC2 instance cần tải bản cập nhật bảo mật hàng tháng từ vendor bên ngoài. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Tạo internet gateway và gắn vào VPC. Cấu hình route table private subnet dùng internet gateway làm default route.',
      B: 'Tạo NAT gateway và đặt trong public subnet. Cấu hình route table private subnet dùng NAT gateway làm default route.',
      C: 'Tạo NAT instance và đặt trong cùng subnet với EC2 instance. Cấu hình route table private subnet dùng NAT instance làm default route.',
      D: 'Tạo internet gateway và gắn vào VPC. Tạo NAT instance và đặt trong cùng subnet với EC2 instance. Cấu hình route table private subnet dùng internet gateway làm default route.',
    },
  },
  252: {
    questionVi:
      'Kiến trúc sư giải pháp cần thiết kế hệ thống lưu trữ hồ sơ vụ án khách hàng. Tệp là tài sản cốt lõi và quan trọng của công ty. Số tệp sẽ tăng theo thời gian. Tệp phải được truy cập đồng thời từ nhiều application servers chạy trên Amazon EC2 instances. Giải pháp phải có dự phòng tích hợp. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Amazon Elastic File System (Amazon EFS)',
      B: 'Amazon Elastic Block Store (Amazon EBS)',
      C: 'Amazon S3 Glacier Deep Archive',
      D: 'AWS Backup',
    },
  },
  253: {
    questionVi:
      'Một kiến trúc sư giải pháp tạo hai IAM policies: Policy1 và Policy2. Cả hai policies được gắn vào IAM group. Một cloud engineer được thêm làm IAM user vào IAM group. Cloud engineer sẽ thực hiện được hành động nào?',
    optionsVi: {
      A: 'Xóa IAM users',
      B: 'Xóa directories',
      C: 'Xóa Amazon EC2 instances',
      D: 'Xóa logs từ Amazon CloudWatch Logs',
    },
  },
  254: {
    questionVi:
      'Một công ty đang rà soát migration gần đây của ứng dụng ba tầng lên VPC. Đội bảo mật phát hiện nguyên tắc least privilege không được áp dụng cho ingress và egress rules của Amazon EC2 security group giữa các tầng ứng dụng. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Tạo security group rules dùng instance ID làm source hoặc destination.',
      B: 'Tạo security group rules dùng security group ID làm source hoặc destination.',
      C: 'Tạo security group rules dùng VPC CIDR blocks làm source hoặc destination.',
      D: 'Tạo security group rules dùng subnet CIDR blocks làm source hoặc destination.',
    },
  },
  255: {
    questionVi:
      'Một công ty có quy trình checkout thương mại điện tử ghi đơn hàng vào database và gọi dịch vụ xử lý thanh toán. Người dùng gặp timeout trong quá trình checkout. Khi gửi lại form checkout, nhiều đơn hàng duy nhất được tạo cho cùng giao dịch. Kiến trúc sư giải pháp nên refactor quy trình như thế nào để ngăn tạo nhiều đơn hàng?',
    optionsVi: {
      A: 'Cấu hình ứng dụng web gửi order message tới Amazon Kinesis Data Firehose. Đặt payment service lấy message từ Kinesis Data Firehose và xử lý đơn hàng.',
      B: 'Tạo rule trong AWS CloudTrail gọi AWS Lambda function dựa trên application path request đã ghi log. Dùng Lambda truy vấn database, gọi payment service và truyền thông tin đơn hàng.',
      C: 'Lưu đơn hàng trong database. Gửi message kèm order number tới Amazon Simple Notification Service (Amazon SNS). Đặt payment service poll Amazon SNS, lấy message và xử lý đơn hàng.',
      D: 'Lưu đơn hàng trong database. Gửi message kèm order number tới Amazon Simple Queue Service (Amazon SQS) FIFO queue. Đặt payment service lấy message và xử lý đơn hàng. Xóa message khỏi queue.',
    },
  },
  256: {
    questionVi:
      'Kiến trúc sư giải pháp triển khai ứng dụng xem xét tài liệu dùng Amazon S3 bucket lưu trữ. Giải pháp phải ngăn xóa tài liệu nhầm và đảm bảo mọi phiên bản tài liệu khả dụng. Người dùng phải có thể tải xuống, sửa đổi và upload tài liệu. Kiến trúc sư giải pháp nên kết hợp hành động nào? (Chọn hai.)',
    optionsVi: {
      A: 'Bật read-only bucket ACL.',
      B: 'Bật versioning trên bucket.',
      C: 'Gắn IAM policy vào bucket.',
      D: 'Bật MFA Delete trên bucket.',
      E: 'Mã hóa bucket bằng AWS KMS.',
    },
  },
  257: {
    questionVi:
      'Một công ty xây dựng giải pháp báo cáo sự kiện Amazon EC2 Auto Scaling trên tất cả ứng dụng trong tài khoản AWS. Công ty cần giải pháp serverless lưu dữ liệu trạng thái EC2 Auto Scaling trong Amazon S3. Công ty sau đó dùng dữ liệu trong S3 cung cấp cập nhật gần thời gian thực trên dashboard. Giải pháp không được ảnh hưởng tốc độ khởi chạy EC2 instance. Công ty nên chuyển dữ liệu lên S3 như thế nào?',
    optionsVi: {
      A: 'Dùng Amazon CloudWatch metric stream gửi dữ liệu trạng thái EC2 Auto Scaling tới Amazon Kinesis Data Firehose. Lưu dữ liệu trong Amazon S3.',
      B: 'Khởi chạy Amazon EMR cluster thu thập dữ liệu trạng thái EC2 Auto Scaling và gửi tới Amazon Kinesis Data Firehose. Lưu dữ liệu trong Amazon S3.',
      C: 'Tạo Amazon EventBridge rule gọi AWS Lambda function theo lịch. Cấu hình Lambda function gửi dữ liệu trạng thái EC2 Auto Scaling trực tiếp tới Amazon S3.',
      D: 'Dùng bootstrap script khi khởi chạy EC2 instance cài Amazon Kinesis Agent. Cấu hình Kinesis Agent thu thập dữ liệu trạng thái EC2 Auto Scaling và gửi tới Amazon Kinesis Data Firehose. Lưu dữ liệu trong Amazon S3.',
    },
  },
  258: {
    questionVi:
      'Một công ty có ứng dụng đặt hàng trăm tệp .csv vào Amazon S3 bucket mỗi giờ. Tệp dung lượng 1 GB. Mỗi khi tệp được upload, công ty cần chuyển tệp sang định dạng Apache Parquet và đặt tệp output vào S3 bucket. Giải pháp nào đáp ứng với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo AWS Lambda function tải tệp .csv, chuyển sang Parquet và đặt tệp output vào S3 bucket. Gọi Lambda function cho mỗi sự kiện S3 PUT.',
      B: 'Tạo Apache Spark job đọc tệp .csv, chuyển sang Parquet và đặt tệp output vào S3 bucket. Tạo AWS Lambda function cho mỗi sự kiện S3 PUT gọi Spark job.',
      C: 'Tạo AWS Glue table và AWS Glue crawler cho S3 bucket nơi ứng dụng đặt tệp .csv. Lên lịch AWS Lambda function định kỳ dùng Amazon Athena truy vấn AWS Glue table, chuyển kết quả sang Parquet và đặt tệp output vào S3 bucket.',
      D: 'Tạo AWS Glue extract, transform, and load (ETL) job chuyển tệp .csv sang Parquet và đặt tệp output vào S3 bucket. Tạo AWS Lambda function cho mỗi sự kiện S3 PUT gọi ETL job.',
    },
  },
  259: {
    questionVi:
      'Một công ty triển khai chính sách lưu giữ dữ liệu mới cho tất cả databases chạy trên Amazon RDS DB instances. Công ty phải giữ backup hàng ngày tối thiểu 2 năm. Backup phải nhất quán và có thể khôi phục. Kiến trúc sư giải pháp nên đề xuất giải pháp nào?',
    optionsVi: {
      A: 'Tạo backup vault trong AWS Backup để giữ RDS backups. Tạo backup plan mới với lịch hàng ngày và thời hạn hết hạn 2 năm sau khi tạo. Gán RDS DB instances vào backup plan.',
      B: 'Cấu hình backup window cho RDS DB instances để snapshot hàng ngày. Gán snapshot retention policy 2 năm cho từng RDS DB instance. Dùng Amazon Data Lifecycle Manager (Amazon DLM) lên lịch xóa snapshot.',
      C: 'Cấu hình database transaction logs tự động backup lên Amazon CloudWatch Logs với thời hạn 2 năm.',
      D: 'Cấu hình AWS Database Migration Service (AWS DMS) replication task. Triển khai replication instance và cấu hình change data capture (CDC) task stream thay đổi database tới Amazon S3 làm target. Cấu hình S3 Lifecycle policies xóa snapshots sau 2 năm.',
    },
  },
  260: {
    questionVi:
      'Đội tuân thủ công ty cần chuyển file shares lên AWS. Shares chạy trên Windows Server SMB file share. Active Directory on-premises tự quản lý kiểm soát truy cập tệp và thư mục. Công ty muốn dùng Amazon FSx for Windows File Server trong giải pháp. Công ty phải đảm bảo nhóm Active Directory on-premises hạn chế truy cập SMB compliance shares, thư mục và tệp FSx for Windows File Server sau khi chuyển lên AWS. Công ty đã tạo FSx for Windows File Server file system. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo Active Directory Connector kết nối Active Directory. Ánh xạ nhóm Active Directory sang IAM groups để hạn chế truy cập.',
      B: 'Gán tag có Restrict tag key và Compliance tag value. Ánh xạ nhóm Active Directory sang IAM groups để hạn chế truy cập.',
      C: 'Tạo IAM service-linked role liên kết trực tiếp với FSx for Windows File Server để hạn chế truy cập.',
      D: 'Join file system vào Active Directory để hạn chế truy cập.',
    },
  },
  261: {
    questionVi:
      'Một công ty gần đây triển khai website bán lẻ tới khán giả toàn cầu. Website chạy trên nhiều Amazon EC2 instances phía sau Elastic Load Balancer. Instances chạy trong Auto Scaling group trên nhiều Availability Zones. Công ty muốn cung cấp nội dung phiên bản khác nhau cho khách hàng dựa trên thiết bị họ dùng truy cập website. Kiến trúc sư giải pháp nên kết hợp hành động nào? (Chọn hai.)',
    optionsVi: {
      A: 'Cấu hình Amazon CloudFront cache nhiều phiên bản nội dung.',
      B: 'Cấu hình host header trong Network Load Balancer chuyển traffic tới instances khác nhau.',
      C: 'Cấu hình Lambda@Edge function gửi object cụ thể cho người dùng dựa trên header User-Agent.',
      D: 'Cấu hình AWS Global Accelerator. Chuyển tiếp yêu cầu tới Network Load Balancer (NLB). Cấu hình NLB thiết lập host-based routing tới EC2 instances khác nhau.',
      E: 'Cấu hình AWS Global Accelerator. Chuyển tiếp yêu cầu tới NLB. Cấu hình NLB thiết lập path-based routing tới EC2 instances khác nhau.',
    },
  },
};

const out = writeBatch(9, 237, 261, T);
console.log('Wrote', out);
