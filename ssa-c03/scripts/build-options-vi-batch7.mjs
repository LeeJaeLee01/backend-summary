#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'data');

const T = {
  187: {
    questionVi:
      'Một công ty đang phát triển ứng dụng thương mại điện tử gồm front-end có cân bằng tải, ứng dụng dựa trên container và cơ sở dữ liệu quan hệ. Kiến trúc sư giải pháp cần tạo giải pháp có tính sẵn sàng cao, vận hành với ít can thiệp thủ công nhất có thể. Giải pháp nào đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Tạo Amazon RDS DB instance ở chế độ Multi-AZ.',
      B: 'Tạo Amazon RDS DB instance và một hoặc nhiều replica ở Availability Zone khác.',
      C: 'Tạo cluster Docker dựa trên Amazon EC2 instance để xử lý tải ứng dụng động.',
      D: 'Tạo cluster Amazon Elastic Container Service (Amazon ECS) với launch type Fargate để xử lý tải ứng dụng động.',
      E: 'Tạo cluster Amazon ECS với launch type Amazon EC2 để xử lý tải ứng dụng động.',
    },
  },
  188: {
    questionVi:
      'Một công ty dùng Amazon S3 làm data lake. Công ty có đối tác mới phải dùng SFTP để upload tệp dữ liệu. Kiến trúc sư giải pháp cần triển khai giải pháp SFTP có tính sẵn sàng cao, giảm tối đa chi phí vận hành. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng AWS Transfer Family để cấu hình server hỗ trợ SFTP với endpoint truy cập công khai. Chọn S3 data lake làm đích.',
      B: 'Dùng Amazon S3 File Gateway làm SFTP server. Expose URL endpoint S3 File Gateway cho đối tác mới. Chia sẻ endpoint S3 File Gateway với đối tác mới.',
      C: 'Khởi chạy Amazon EC2 instance trong private subnet của VPC. Hướng dẫn đối tác upload tệp lên EC2 instance qua VPN. Chạy cron job script trên EC2 để upload tệp lên S3 data lake.',
      D: 'Khởi chạy Amazon EC2 instances trong private subnet của VPC. Đặt Network Load Balancer (NLB) phía trước các EC2 instances. Tạo SFTP listener port cho NLB. Chia sẻ hostname NLB với đối tác mới. Chạy cron job script trên EC2 để upload tệp lên S3 data lake.',
    },
  },
  189: {
    questionVi:
      'Một công ty cần lưu trữ tài liệu hợp đồng. Hợp đồng có hiệu lực 5 năm. Trong 5 năm đó, công ty phải đảm bảo tài liệu không thể bị ghi đè hoặc xóa. Công ty cần mã hóa tài liệu khi lưu trữ (at rest) và tự động xoay vòng khóa mã hóa mỗi năm. Kiến trúc sư giải pháp nên kết hợp bước nào để đáp ứng yêu cầu với chi phí vận hành THẤP NHẤT? (Chọn hai.)',
    optionsVi: {
      A: 'Lưu tài liệu trong Amazon S3. Dùng S3 Object Lock ở chế độ governance mode.',
      B: 'Lưu tài liệu trong Amazon S3. Dùng S3 Object Lock ở chế độ compliance mode.',
      C: 'Dùng server-side encryption với Amazon S3 managed encryption keys (SSE-S3). Cấu hình xoay vòng khóa.',
      D: 'Dùng server-side encryption với AWS Key Management Service (AWS KMS) customer managed keys. Cấu hình xoay vòng khóa.',
      E: 'Dùng server-side encryption với AWS KMS customer provided (imported) keys. Cấu hình xoay vòng khóa.',
    },
  },
  190: {
    questionVi:
      'Một công ty có ứng dụng web dựa trên Java và PHP. Công ty dự định chuyển ứng dụng từ on-premises lên AWS. Công ty cần khả năng test tính năng mới thường xuyên. Công ty cũng cần giải pháp có tính sẵn sàng cao, được quản lý và yêu cầu chi phí vận hành tối thiểu. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo Amazon S3 bucket. Bật static web hosting trên S3 bucket. Upload nội dung tĩnh lên S3 bucket. Dùng AWS Lambda xử lý toàn bộ nội dung động.',
      B: 'Triển khai ứng dụng web lên môi trường AWS Elastic Beanstalk. Dùng URL swapping để chuyển giữa nhiều môi trường Elastic Beanstalk để test tính năng.',
      C: 'Triển khai ứng dụng web lên Amazon EC2 instances cấu hình Java và PHP. Dùng Auto Scaling groups và Application Load Balancer để quản lý tính sẵn sàng của website.',
      D: 'Đóng gói container ứng dụng web. Triển khai lên Amazon EC2 instances. Dùng AWS Load Balancer Controller để định tuyến traffic động giữa các container chứa tính năng mới để test.',
    },
  },
  191: {
    questionVi:
      'Một công ty có ứng dụng đặt hàng lưu thông tin khách hàng trong Amazon RDS for MySQL. Trong giờ làm việc, nhân viên chạy truy vấn một lần phục vụ báo cáo. Timeout xảy ra khi xử lý đơn hàng vì truy vấn báo cáo chạy rất lâu. Công ty cần loại bỏ timeout mà không ngăn nhân viên thực hiện truy vấn. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Tạo read replica. Chuyển truy vấn báo cáo sang read replica.',
      B: 'Tạo read replica. Phân phối ứng dụng đặt hàng cho cả primary DB instance và read replica.',
      C: 'Di chuyển ứng dụng đặt hàng sang Amazon DynamoDB với on-demand capacity.',
      D: 'Lên lịch truy vấn báo cáo vào giờ không cao điểm.',
    },
  },
  192: {
    questionVi:
      'Một bệnh viện muốn tạo bản sao số cho bộ sưu tập hồ sơ viết lịch sử lớn. Bệnh viện sẽ tiếp tục thêm hàng trăm tài liệu mới mỗi ngày. Đội dữ liệu của bệnh viện sẽ scan tài liệu và upload lên AWS Cloud. Kiến trúc sư giải pháp phải triển khai giải pháp phân tích tài liệu, trích xuất thông tin y tế và lưu trữ để ứng dụng có thể chạy truy vấn SQL trên dữ liệu. Giải pháp phải tối đa hóa khả năng mở rộng và hiệu quả vận hành. Kiến trúc sư giải pháp nên kết hợp bước nào? (Chọn hai.)',
    optionsVi: {
      A: 'Ghi thông tin tài liệu vào Amazon EC2 instance chạy MySQL database.',
      B: 'Ghi thông tin tài liệu vào Amazon S3 bucket. Dùng Amazon Athena để truy vấn dữ liệu.',
      C: 'Tạo Auto Scaling group gồm Amazon EC2 instances chạy ứng dụng tùy chỉnh xử lý tệp đã scan và trích xuất thông tin y tế.',
      D: 'Tạo AWS Lambda function chạy khi có tài liệu mới upload. Dùng Amazon Rekognition chuyển tài liệu sang văn bản thô. Dùng Amazon Transcribe Medical phát hiện và trích xuất thông tin y tế liên quan từ văn bản.',
      E: 'Tạo AWS Lambda function chạy khi có tài liệu mới upload. Dùng Amazon Textract chuyển tài liệu sang văn bản thô. Dùng Amazon Comprehend Medical phát hiện và trích xuất thông tin y tế liên quan từ văn bản.',
    },
  },
  193: {
    questionVi:
      'Một công ty chạy ứng dụng batch trên Amazon EC2 instances. Ứng dụng gồm backend với nhiều Amazon RDS databases. Ứng dụng gây ra số lượng read cao trên các database. Kiến trúc sư giải pháp phải giảm số read database đồng thời đảm bảo tính sẵn sàng cao. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Thêm Amazon RDS read replicas.',
      B: 'Dùng Amazon ElastiCache for Redis.',
      C: 'Dùng Amazon Route 53 DNS caching.',
      D: 'Dùng Amazon ElastiCache for Memcached.',
    },
  },
  194: {
    questionVi:
      'Một công ty cần chạy ứng dụng quan trọng trên AWS. Công ty cần dùng Amazon EC2 làm database cho ứng dụng. Database phải có tính sẵn sàng cao và tự động failover khi xảy ra sự cố nghiêm trọng. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Khởi chạy hai EC2 instances, mỗi instance ở Availability Zone khác nhau trong cùng AWS Region. Cài database trên cả hai EC2 instances. Cấu hình EC2 instances thành cluster. Thiết lập database replication.',
      B: 'Khởi chạy EC2 instance trong một Availability Zone. Cài database trên EC2 instance. Dùng Amazon Machine Image (AMI) để backup dữ liệu. Dùng AWS CloudFormation tự động cấp phát EC2 instance khi xảy ra sự cố.',
      C: 'Khởi chạy hai EC2 instances, mỗi instance ở AWS Region khác nhau. Cài database trên cả hai EC2 instances. Thiết lập database replication. Failover database sang Region thứ hai.',
      D: 'Khởi chạy EC2 instance trong một Availability Zone. Cài database trên EC2 instance. Dùng AMI để backup dữ liệu. Dùng EC2 automatic recovery để khôi phục instance khi xảy ra sự cố.',
    },
  },
  195: {
    questionVi:
      'Hệ thống đặt hàng của công ty gửi yêu cầu từ client tới Amazon EC2 instances. EC2 instances xử lý đơn hàng rồi lưu vào database trên Amazon RDS. Người dùng báo phải xử lý lại đơn hàng khi hệ thống lỗi. Công ty muốn giải pháp resilient tự động xử lý đơn hàng khi hệ thống ngừng hoạt động. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Đưa EC2 instances vào Auto Scaling group. Tạo Amazon EventBridge (Amazon CloudWatch Events) rule nhắm tới Amazon Elastic Container Service (Amazon ECS) task.',
      B: 'Đưa EC2 instances vào Auto Scaling group phía sau Application Load Balancer (ALB). Cập nhật hệ thống đặt hàng gửi message tới endpoint ALB.',
      C: 'Đưa EC2 instances vào Auto Scaling group. Cấu hình hệ thống đặt hàng gửi message tới Amazon Simple Queue Service (Amazon SQS) queue. Cấu hình EC2 instances consume message từ queue.',
      D: 'Tạo Amazon Simple Notification Service (Amazon SNS) topic. Tạo AWS Lambda function và subscribe function vào SNS topic. Cấu hình hệ thống đặt hàng gửi message tới SNS topic. Gửi lệnh tới EC2 instances xử lý message bằng AWS Systems Manager Run Command.',
    },
  },
  196: {
    questionVi:
      'Một công ty chạy ứng dụng trên đội lớn Amazon EC2 instances. Ứng dụng đọc và ghi vào bảng Amazon DynamoDB. Kích thước bảng DynamoDB liên tục tăng, nhưng ứng dụng chỉ cần dữ liệu 30 ngày gần nhất. Công ty cần giải pháp tối thiểu hóa chi phí và công sức phát triển. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng AWS CloudFormation template triển khai toàn bộ giải pháp. Redeploy CloudFormation stack mỗi 30 ngày và xóa stack gốc.',
      B: 'Dùng EC2 instance chạy ứng dụng giám sát từ AWS Marketplace. Cấu hình ứng dụng giám sát dùng Amazon DynamoDB Streams lưu timestamp khi item mới được tạo. Dùng script chạy trên EC2 instance xóa item có timestamp cũ hơn 30 ngày.',
      C: 'Cấu hình Amazon DynamoDB Streams gọi AWS Lambda function khi item mới được tạo. Cấu hình Lambda function xóa item trong bảng cũ hơn 30 ngày.',
      D: 'Mở rộng ứng dụng thêm attribute có giá trị timestamp hiện tại cộng 30 ngày cho mỗi item mới. Cấu hình DynamoDB dùng attribute đó làm TTL attribute.',
    },
  },
  197: {
    questionVi:
      'Một công ty có ứng dụng Microsoft .NET chạy trên Windows Server on-premises. Ứng dụng lưu dữ liệu bằng Oracle Database Standard Edition server. Công ty dự định migrate lên AWS và muốn tối thiểu hóa thay đổi phát triển. Môi trường ứng dụng AWS phải có tính sẵn sàng cao. Công ty nên kết hợp hành động nào? (Chọn hai.)',
    optionsVi: {
      A: 'Tái cấu trúc ứng dụng thành serverless với AWS Lambda functions chạy .NET Core.',
      B: 'Tái lưu trữ ứng dụng trên AWS Elastic Beanstalk với nền tảng .NET, triển khai Multi-AZ.',
      C: 'Tái nền tảng ứng dụng chạy trên Amazon EC2 với Amazon Linux Amazon Machine Image (AMI).',
      D: 'Dùng AWS Database Migration Service (AWS DMS) migrate từ Oracle database sang Amazon DynamoDB, triển khai Multi-AZ.',
      E: 'Dùng AWS DMS migrate từ Oracle database sang Oracle trên Amazon RDS, triển khai Multi-AZ.',
    },
  },
  198: {
    questionVi:
      'Một công ty chạy ứng dụng containerized trên Kubernetes cluster trong data center on-premises. Ứng dụng dùng MongoDB database lưu trữ dữ liệu. Công ty muốn migrate một phần môi trường lên AWS, nhưng hiện tại không thể thay đổi code hoặc phương thức triển khai. Công ty cần giải pháp giảm tối đa chi phí vận hành. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng Amazon Elastic Container Service (Amazon ECS) với Amazon EC2 worker nodes cho compute và MongoDB trên EC2 cho lưu trữ dữ liệu.',
      B: 'Dùng Amazon ECS với AWS Fargate cho compute và Amazon DynamoDB cho lưu trữ dữ liệu.',
      C: 'Dùng Amazon Elastic Kubernetes Service (Amazon EKS) với Amazon EC2 worker nodes cho compute và Amazon DynamoDB cho lưu trữ dữ liệu.',
      D: 'Dùng Amazon EKS với AWS Fargate cho compute và Amazon DocumentDB (with MongoDB compatibility) cho lưu trữ dữ liệu.',
    },
  },
  199: {
    questionVi:
      'Một công ty telemarketing thiết kế chức năng call center khách hàng trên AWS. Công ty cần giải pháp nhận diện nhiều người nói và tạo tệp transcript. Công ty muốn truy vấn tệp transcript để phân tích mô hình kinh doanh. Tệp transcript phải được lưu 7 năm phục vụ kiểm toán. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng Amazon Rekognition cho nhận diện nhiều người nói. Lưu tệp transcript trong Amazon S3. Dùng machine learning models phân tích tệp transcript.',
      B: 'Dùng Amazon Transcribe cho nhận diện nhiều người nói. Dùng Amazon Athena phân tích tệp transcript.',
      C: 'Dùng Amazon Translate cho nhận diện nhiều người nói. Lưu tệp transcript trong Amazon Redshift. Dùng truy vấn SQL phân tích tệp transcript.',
      D: 'Dùng Amazon Rekognition cho nhận diện nhiều người nói. Lưu tệp transcript trong Amazon S3. Dùng Amazon Textract phân tích tệp transcript.',
    },
  },
  200: {
    questionVi:
      'Một công ty host ứng dụng trên AWS. Công ty dùng Amazon Cognito quản lý người dùng. Khi đăng nhập, ứng dụng lấy dữ liệu từ Amazon DynamoDB qua REST API host trên Amazon API Gateway. Công ty muốn giải pháp AWS managed kiểm soát truy cập REST API để giảm công sức phát triển. Giải pháp nào đáp ứng với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Cấu hình AWS Lambda function làm authorizer trong API Gateway để xác thực người dùng gửi yêu cầu.',
      B: 'Với mỗi người dùng, tạo và gán API key phải gửi kèm mỗi yêu cầu. Xác thực key bằng AWS Lambda function.',
      C: 'Gửi email người dùng trong header mỗi yêu cầu. Gọi AWS Lambda function xác thực người dùng có email đó có quyền truy cập phù hợp.',
      D: 'Cấu hình Amazon Cognito user pool authorizer trong API Gateway để Cognito xác thực mỗi yêu cầu.',
    },
  },
  201: {
    questionVi:
      'Một công ty phát triển dịch vụ truyền thông marketing nhắm tới người dùng ứng dụng di động. Công ty cần gửi tin nhắn xác nhận qua Short Message Service (SMS) cho người dùng. Người dùng phải có thể trả lời tin SMS. Công ty phải lưu phản hồi trong 1 năm để phân tích. Kiến trúc sư giải pháp nên làm gì?',
    optionsVi: {
      A: 'Tạo Amazon Connect contact flow gửi tin SMS. Dùng AWS Lambda xử lý phản hồi.',
      B: 'Xây dựng Amazon Pinpoint journey. Cấu hình Amazon Pinpoint gửi sự kiện tới Amazon Kinesis data stream để phân tích và lưu trữ.',
      C: 'Dùng Amazon Simple Queue Service (Amazon SQS) phân phối tin SMS. Dùng AWS Lambda xử lý phản hồi.',
      D: 'Tạo Amazon Simple Notification Service (Amazon SNS) FIFO topic. Subscribe Amazon Kinesis data stream vào SNS topic để phân tích và lưu trữ.',
    },
  },
  202: {
    questionVi:
      'Một công ty dự định chuyển dữ liệu lên Amazon S3 bucket. Dữ liệu phải được mã hóa khi lưu trong S3 bucket. Khóa mã hóa phải tự động xoay vòng mỗi năm. Giải pháp nào đáp ứng với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Chuyển dữ liệu vào S3 bucket. Dùng server-side encryption với Amazon S3 managed encryption keys (SSE-S3). Dùng hành vi xoay vòng khóa tích hợp của SSE-S3.',
      B: 'Tạo AWS Key Management Service (AWS KMS) customer managed key. Bật automatic key rotation. Đặt hành vi mã hóa mặc định của S3 bucket dùng customer managed KMS key. Chuyển dữ liệu vào S3 bucket.',
      C: 'Tạo AWS KMS customer managed key. Đặt hành vi mã hóa mặc định của S3 bucket dùng customer managed KMS key. Chuyển dữ liệu vào S3 bucket. Xoay vòng KMS key thủ công mỗi năm.',
      D: 'Mã hóa dữ liệu bằng customer key material trước khi chuyển lên S3 bucket. Tạo AWS KMS key không có key material. Import customer key material vào KMS key. Bật automatic key rotation.',
    },
  },
  203: {
    questionVi:
      'Khách hàng của công ty tài chính đặt lịch hẹn với cố vấn tài chính bằng cách gửi tin nhắn văn bản. Ứng dụng web chạy trên Amazon EC2 instances nhận yêu cầu đặt lịch. Tin nhắn được publish lên Amazon Simple Queue Service (Amazon SQS) queue qua ứng dụng web. Ứng dụng khác chạy trên EC2 instances gửi lời mời họp và email xác nhận cho khách hàng. Sau khi lên lịch thành công, ứng dụng lưu thông tin cuộc họp vào Amazon DynamoDB database. Khi công ty mở rộng, khách hàng báo lời mời họp đến chậm hơn. Kiến trúc sư giải pháp nên đề xuất gì?',
    optionsVi: {
      A: 'Thêm DynamoDB Accelerator (DAX) cluster phía trước DynamoDB database.',
      B: 'Thêm Amazon API Gateway API phía trước ứng dụng web nhận yêu cầu đặt lịch.',
      C: 'Thêm Amazon CloudFront distribution. Đặt origin là ứng dụng web nhận yêu cầu đặt lịch.',
      D: 'Thêm Auto Scaling group cho ứng dụng gửi lời mời họp. Cấu hình Auto Scaling group scale theo độ sâu SQS queue.',
    },
  },
  204: {
    questionVi:
      'Một công ty bán lẻ trực tuyến có hơn 50 triệu khách hàng hoạt động và nhận hơn 25.000 đơn hàng mỗi ngày. Công ty thu thập dữ liệu mua hàng và lưu trong Amazon S3. Dữ liệu khách hàng bổ sung lưu trong Amazon RDS. Công ty muốn các đội phân tích truy cập toàn bộ dữ liệu. Giải pháp phải quản lý quyền chi tiết (fine-grained permissions) và giảm tối đa chi phí vận hành. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Migrate dữ liệu mua hàng ghi trực tiếp vào Amazon RDS. Dùng RDS access controls giới hạn truy cập.',
      B: 'Lên lịch AWS Lambda function định kỳ copy dữ liệu từ Amazon RDS sang Amazon S3. Tạo AWS Glue crawler. Dùng Amazon Athena truy vấn dữ liệu. Dùng S3 policies giới hạn truy cập.',
      C: 'Tạo data lake bằng AWS Lake Formation. Tạo AWS Glue JDBC connection tới Amazon RDS. Đăng ký S3 bucket trong Lake Formation. Dùng Lake Formation access controls giới hạn truy cập.',
      D: 'Tạo Amazon Redshift cluster. Lên lịch AWS Lambda function định kỳ copy dữ liệu từ Amazon S3 và Amazon RDS sang Amazon Redshift. Dùng Amazon Redshift access controls giới hạn truy cập.',
    },
  },
  205: {
    questionVi:
      'Một công ty host website marketing trong data center on-premises. Website gồm tài liệu tĩnh và chạy trên một server. Quản trị viên cập nhật nội dung website không thường xuyên và dùng SFTP client upload tài liệu mới. Công ty quyết định host website trên AWS và dùng Amazon CloudFront. Kiến trúc sư giải pháp đã tạo CloudFront distribution. Kiến trúc sư giải pháp phải thiết kế kiến trúc origin CloudFront tiết kiệm chi phí và có tính resilient nhất. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo virtual server bằng Amazon Lightsail. Cấu hình web server trong Lightsail instance. Upload nội dung website bằng SFTP client.',
      B: 'Tạo AWS Auto Scaling group cho Amazon EC2 instances. Dùng Application Load Balancer. Upload nội dung website bằng SFTP client.',
      C: 'Tạo private Amazon S3 bucket. Dùng S3 bucket policy cho phép truy cập từ CloudFront origin access identity (OAI). Upload nội dung website bằng AWS CLI.',
      D: 'Tạo public Amazon S3 bucket. Cấu hình AWS Transfer for SFTP. Cấu hình S3 bucket cho website hosting. Upload nội dung website bằng SFTP client.',
    },
  },
  206: {
    questionVi:
      'Một công ty muốn quản lý Amazon Machine Images (AMIs). Công ty hiện copy AMIs sang cùng AWS Region nơi AMIs được tạo. Công ty cần thiết kế ứng dụng ghi lại AWS API calls và gửi cảnh báo khi thao tác Amazon EC2 CreateImage API được gọi trong tài khoản công ty. Giải pháp nào đáp ứng với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo AWS Lambda function truy vấn AWS CloudTrail logs và gửi cảnh báo khi phát hiện CreateImage API call.',
      B: 'Cấu hình AWS CloudTrail với Amazon Simple Notification Service (Amazon SNS) notification khi log mới được gửi tới Amazon S3. Dùng Amazon Athena tạo bảng mới và truy vấn CreateImage khi phát hiện API call.',
      C: 'Tạo Amazon EventBridge (Amazon CloudWatch Events) rule cho CreateImage API call. Cấu hình target là Amazon Simple Notification Service (Amazon SNS) topic để gửi cảnh báo khi phát hiện CreateImage API call.',
      D: 'Cấu hình Amazon Simple Queue Service (Amazon SQS) FIFO queue làm target cho AWS CloudTrail logs. Tạo AWS Lambda function gửi cảnh báo tới Amazon SNS topic khi phát hiện CreateImage API call.',
    },
  },
  207: {
    questionVi:
      'Một công ty sở hữu API bất đồng bộ nhận yêu cầu người dùng và, tùy loại yêu cầu, chuyển tới microservice phù hợp để xử lý. Công ty dùng Amazon API Gateway triển khai API front end và AWS Lambda function gọi Amazon DynamoDB lưu yêu cầu người dùng trước khi chuyển tới microservice xử lý. Công ty cấp phát throughput DynamoDB tối đa theo ngân sách, nhưng vẫn gặp vấn đề tính sẵn sàng và mất yêu cầu người dùng. Kiến trúc sư giải pháp nên làm gì mà không ảnh hưởng người dùng hiện tại?',
    optionsVi: {
      A: 'Thêm throttling trên API Gateway với server-side throttling limits.',
      B: 'Dùng DynamoDB Accelerator (DAX) và Lambda để buffer ghi vào DynamoDB.',
      C: 'Tạo secondary index trong DynamoDB cho bảng chứa yêu cầu người dùng.',
      D: 'Dùng Amazon Simple Queue Service (Amazon SQS) queue và Lambda để buffer ghi vào DynamoDB.',
    },
  },
  208: {
    questionVi:
      'Một công ty cần chuyển dữ liệu từ Amazon EC2 instance sang Amazon S3 bucket. Công ty phải đảm bảo không có API call và dữ liệu nào đi qua internet công cộng. Chỉ EC2 instance mới có quyền upload dữ liệu lên S3 bucket. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo interface VPC endpoint cho Amazon S3 trong subnet nơi EC2 instance đặt. Gắn resource policy vào S3 bucket chỉ cho phép IAM role của EC2 instance truy cập.',
      B: 'Tạo gateway VPC endpoint cho Amazon S3 trong Availability Zone nơi EC2 instance đặt. Gắn security groups phù hợp cho endpoint. Gắn resource policy vào S3 bucket chỉ cho phép IAM role của EC2 instance truy cập.',
      C: 'Chạy công cụ nslookup từ trong EC2 instance để lấy private IP address của S3 bucket service API endpoint. Tạo route trong VPC route table cung cấp cho EC2 instance truy cập S3 bucket. Gắn resource policy vào S3 bucket chỉ cho phép IAM role của EC2 instance truy cập.',
      D: 'Dùng tệp ip-ranges.json công khai do AWS cung cấp để lấy private IP address của S3 bucket service API endpoint. Tạo route trong VPC route table cung cấp cho EC2 instance truy cập S3 bucket. Gắn resource policy vào S3 bucket chỉ cho phép IAM role của EC2 instance truy cập.',
    },
  },
  209: {
    questionVi:
      'Một kiến trúc sư giải pháp thiết kế kiến trúc ứng dụng mới triển khai lên AWS Cloud. Ứng dụng chạy trên Amazon EC2 On-Demand Instances và tự động scale qua nhiều Availability Zones. EC2 instances scale lên xuống thường xuyên trong ngày. Application Load Balancer (ALB) xử lý phân phối tải. Kiến trúc cần hỗ trợ quản lý session data phân tán. Công ty sẵn sàng thay đổi code nếu cần. Kiến trúc sư giải pháp nên làm gì để đảm bảo kiến trúc hỗ trợ quản lý session data phân tán?',
    optionsVi: {
      A: 'Dùng Amazon ElastiCache quản lý và lưu trữ session data.',
      B: 'Dùng session affinity (sticky sessions) của ALB để quản lý session data.',
      C: 'Dùng Session Manager từ AWS Systems Manager để quản lý session.',
      D: 'Dùng API operation GetSessionToken trong AWS Security Token Service (AWS STS) để quản lý session.',
    },
  },
  210: {
    questionVi:
      'Một công ty cung cấp dịch vụ giao đồ ăn đang phát triển nhanh. Kiến trúc hiện tại gồm: nhóm Amazon EC2 instances trong Amazon EC2 Auto Scaling group thu thập đơn hàng từ ứng dụng; nhóm EC2 instances khác trong Auto Scaling group thực hiện đơn hàng. Quy trình thu thập đơn nhanh, nhưng thực hiện đơn có thể lâu hơn. Dữ liệu không được mất do sự kiện scale. Kiến trúc sư giải pháp phải đảm bảo cả thu thập và thực hiện đơn đều scale đúng trong giờ cao điểm, tối ưu hóa tài nguyên AWS. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng Amazon CloudWatch metrics giám sát CPU từng instance trong Auto Scaling groups. Cấu hình minimum capacity mỗi Auto Scaling group theo giá trị tải đỉnh.',
      B: 'Dùng Amazon CloudWatch metrics giám sát CPU từng instance trong Auto Scaling groups. Cấu hình CloudWatch alarm gọi Amazon Simple Notification Service (Amazon SNS) topic tạo thêm Auto Scaling groups theo nhu cầu.',
      C: 'Cấp phát hai Amazon Simple Queue Service (Amazon SQS) queues: một cho thu thập đơn, một cho thực hiện đơn. Cấu hình EC2 instances poll queue tương ứng. Scale Auto Scaling groups theo thông báo từ queues.',
      D: 'Cấp phát hai Amazon SQS queues: một cho thu thập đơn, một cho thực hiện đơn. Cấu hình EC2 instances poll queue tương ứng. Tạo metric dựa trên backlog per instance. Scale Auto Scaling groups theo metric này.',
    },
  },
  211: {
    questionVi:
      'Một công ty host nhiều ứng dụng production. Một ứng dụng gồm tài nguyên từ Amazon EC2, AWS Lambda, Amazon RDS, Amazon Simple Notification Service (Amazon SNS) và Amazon Simple Queue Service (Amazon SQS) trên nhiều AWS Regions. Tất cả tài nguyên công ty được gắn tag tên "application" và giá trị tương ứng từng ứng dụng. Kiến trúc sư giải pháp cần giải pháp nhanh nhất để xác định tất cả thành phần đã gắn tag. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng AWS CloudTrail tạo danh sách tài nguyên có tag application.',
      B: 'Dùng AWS CLI truy vấn từng dịch vụ trên tất cả Regions để báo cáo thành phần đã gắn tag.',
      C: 'Chạy truy vấn trong Amazon CloudWatch Logs Insights báo cáo thành phần có tag application.',
      D: 'Chạy truy vấn với AWS Resource Groups Tag Editor báo cáo tài nguyên toàn cầu có tag application.',
    },
  },
};

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const lines = ['/** Options VI Q187–211 */', 'module.exports = {'];
for (const [num, data] of Object.entries(T)) {
  lines.push(`  ${num}: {`);
  lines.push(`    questionVi: '${esc(data.questionVi)}',`);
  lines.push('    optionsVi: {');
  for (const [k, v] of Object.entries(data.optionsVi)) {
    lines.push(`      ${k}: '${esc(v)}',`);
  }
  lines.push('    },');
  lines.push('  },');
}
lines.push('};', '');
fs.writeFileSync(path.join(DATA, 'options-vi-batch7.js'), lines.join('\n'));
console.log('Wrote options-vi-batch7.js');
