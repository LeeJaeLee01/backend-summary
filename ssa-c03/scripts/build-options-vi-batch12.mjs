#!/usr/bin/env node
import { writeBatch } from './build-options-vi-batches.mjs';

const T = {
  312: {
    questionVi:
      'Một công ty có ứng dụng chạy trên nhiều Amazon EC2 instances. Mỗi EC2 instance có nhiều Amazon Elastic Block Store (Amazon EBS) data volumes gắn vào. Cấu hình EC2 instance của ứng dụng và dữ liệu cần được backup mỗi đêm. Ứng dụng cũng cần có khả năng khôi phục ở một AWS Region khác. Giải pháp nào đáp ứng các yêu cầu này theo cách HIỆU QUẢ VẬN HÀNH NHẤT?',
    optionsVi: {
      A: 'Viết AWS Lambda function lên lịch chụp snapshot hằng đêm cho EBS volumes của ứng dụng và sao chép snapshot sang Region khác.',
      B: 'Tạo backup plan bằng AWS Backup để thực hiện backup hằng đêm. Sao chép backup sang Region khác. Thêm EC2 instances của ứng dụng làm resources.',
      C: 'Tạo backup plan bằng AWS Backup để thực hiện backup hằng đêm. Sao chép backup sang Region khác. Thêm EBS volumes của ứng dụng làm resources.',
      D: 'Viết AWS Lambda function lên lịch chụp snapshot hằng đêm cho EBS volumes của ứng dụng và sao chép snapshot sang Availability Zone khác.',
    },
  },
  313: {
    questionVi:
      'Một công ty đang xây dựng ứng dụng di động trên AWS. Công ty muốn mở rộng phạm vi tới hàng triệu người dùng. Công ty cần xây dựng nền tảng để người dùng được ủy quyền có thể xem nội dung của công ty trên thiết bị di động. Kiến trúc sư giải pháp nên đề xuất gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Publish nội dung lên S3 bucket công khai. Dùng AWS Key Management Service (AWS KMS) keys để streaming nội dung.',
      B: 'Thiết lập IPsec VPN giữa ứng dụng di động và môi trường AWS để streaming nội dung.',
      C: 'Dùng Amazon CloudFront. Cung cấp signed URLs để streaming nội dung.',
      D: 'Thiết lập AWS Client VPN giữa ứng dụng di động và môi trường AWS để streaming nội dung.',
    },
  },
  314: {
    questionVi:
      'Một công ty có database MySQL on-premises được đội sales toàn cầu sử dụng với tần suất truy cập không thường xuyên. Đội sales yêu cầu database có downtime tối thiểu. Database administrator muốn migrate database này lên AWS mà không cần chọn instance type cụ thể, dự đoán có thêm người dùng trong tương lai. Kiến trúc sư giải pháp nên đề xuất dịch vụ nào?',
    optionsVi: {
      A: 'Amazon Aurora MySQL',
      B: 'Amazon Aurora Serverless for MySQL',
      C: 'Amazon Redshift Spectrum',
      D: 'Amazon RDS for MySQL',
    },
  },
  315: {
    questionVi:
      'Một công ty bị vi phạm bảo mật ảnh hưởng tới nhiều ứng dụng trong data center on-premises. Kẻ tấn công đã lợi dụng lỗ hổng trong các ứng dụng tùy chỉnh chạy trên server. Công ty đang migrate ứng dụng để chạy trên Amazon EC2 instances. Công ty muốn triển khai giải pháp chủ động quét lỗ hổng trên EC2 instances và gửi báo cáo chi tiết kết quả. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Triển khai AWS Shield để quét lỗ hổng trên EC2 instances. Tạo AWS Lambda function ghi log các phát hiện vào AWS CloudTrail.',
      B: 'Triển khai Amazon Macie và AWS Lambda functions để quét lỗ hổng trên EC2 instances. Ghi log các phát hiện vào AWS CloudTrail.',
      C: 'Bật Amazon GuardDuty. Triển khai GuardDuty agents lên EC2 instances. Cấu hình AWS Lambda function tự động tạo và phân phối báo cáo chi tiết các phát hiện.',
      D: 'Bật Amazon Inspector. Triển khai Amazon Inspector agent lên EC2 instances. Cấu hình AWS Lambda function tự động tạo và phân phối báo cáo chi tiết các phát hiện.',
    },
  },
  316: {
    questionVi:
      'Một công ty dùng Amazon EC2 instance để chạy script poll và xử lý messages trong Amazon Simple Queue Service (Amazon SQS) queue. Công ty muốn giảm chi phí vận hành trong khi vẫn duy trì khả năng xử lý số lượng messages ngày càng tăng được thêm vào queue. Kiến trúc sư giải pháp nên đề xuất gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tăng kích thước EC2 instance để xử lý messages nhanh hơn.',
      B: 'Dùng Amazon EventBridge để tắt EC2 instance khi instance ít được sử dụng.',
      C: 'Migrate script trên EC2 instance sang AWS Lambda function với runtime phù hợp.',
      D: 'Dùng AWS Systems Manager Run Command để chạy script theo yêu cầu.',
    },
  },
  317: {
    questionVi:
      'Một công ty dùng ứng dụng legacy để tạo dữ liệu ở định dạng CSV. Ứng dụng legacy lưu dữ liệu đầu ra trong Amazon S3. Công ty đang triển khai ứng dụng commercial off-the-shelf (COTS) mới có thể thực hiện truy vấn SQL phức tạp để phân tích dữ liệu được lưu trong Amazon Redshift và Amazon S3 mà thôi. Tuy nhiên, ứng dụng COTS không thể xử lý tệp .csv mà ứng dụng legacy tạo ra. Công ty không thể cập nhật ứng dụng legacy để tạo dữ liệu ở định dạng khác. Công ty cần triển khai giải pháp để ứng dụng COTS có thể dùng dữ liệu mà ứng dụng legacy tạo ra. Giải pháp nào đáp ứng các yêu cầu này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo AWS Glue extract, transform, and load (ETL) job chạy theo lịch. Cấu hình ETL job xử lý tệp .csv và lưu dữ liệu đã xử lý vào Amazon Redshift.',
      B: 'Phát triển Python script chạy trên Amazon EC2 instances để chuyển tệp .csv sang tệp .sql. Gọi Python script theo lịch cron để lưu tệp đầu ra vào Amazon S3.',
      C: 'Tạo AWS Lambda function và bảng Amazon DynamoDB. Dùng S3 event gọi Lambda function. Cấu hình Lambda function thực hiện extract, transform, and load (ETL) job xử lý tệp .csv và lưu dữ liệu đã xử lý vào bảng DynamoDB.',
      D: 'Dùng Amazon EventBridge khởi chạy Amazon EMR cluster theo lịch mỗi tuần. Cấu hình EMR cluster thực hiện extract, transform, and load (ETL) job xử lý tệp .csv và lưu dữ liệu đã xử lý vào bảng Amazon Redshift.',
    },
  },
  318: {
    questionVi:
      'Một công ty gần đây đã migrate toàn bộ môi trường IT lên AWS Cloud. Công ty phát hiện người dùng đang cấp phát Amazon EC2 instances có kích thước quá lớn và sửa đổi security group rules mà không dùng quy trình change control phù hợp. Kiến trúc sư giải pháp phải đưa ra chiến lược để theo dõi và audit các thay đổi inventory và configuration này. Kiến trúc sư giải pháp nên thực hiện hành động nào để đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Bật AWS CloudTrail và dùng nó để audit.',
      B: 'Dùng data lifecycle policies cho Amazon EC2 instances.',
      C: 'Bật AWS Trusted Advisor và tham chiếu security dashboard.',
      D: 'Bật AWS Config và tạo rules cho mục đích audit và tuân thủ.',
      E: 'Khôi phục configuration trước đó của resource bằng AWS CloudFormation template.',
    },
  },
  319: {
    questionVi:
      'Một công ty có hàng trăm Amazon EC2 Linux instances trên AWS Cloud. Systems administrators đã dùng SSH keys chung để quản lý các instance. Sau một cuộc audit gần đây, đội bảo mật của công ty yêu cầu loại bỏ toàn bộ shared keys. Kiến trúc sư giải pháp phải thiết kế giải pháp cung cấp quyền truy cập an toàn tới EC2 instances. Giải pháp nào đáp ứng yêu cầu này với công sức quản trị THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Systems Manager Session Manager để kết nối tới EC2 instances.',
      B: 'Dùng AWS Security Token Service (AWS STS) để tạo SSH keys một lần theo yêu cầu.',
      C: 'Cho phép shared SSH access tới một nhóm bastion instances. Cấu hình mọi instance khác chỉ cho phép SSH access từ bastion instances.',
      D: 'Dùng Amazon Cognito custom authorizer để xác thực người dùng. Gọi AWS Lambda function để tạo SSH key tạm thời.',
    },
  },
  320: {
    questionVi:
      'Một công ty dùng nhóm Amazon EC2 instances để nạp dữ liệu từ các nguồn dữ liệu on-premises. Dữ liệu ở định dạng JSON và tốc độ nạp có thể lên tới 1 MB/giây. Khi EC2 instance khởi động lại, dữ liệu đang truyền (in-flight) sẽ bị mất. Đội data science của công ty muốn truy vấn dữ liệu đã nạp gần thời gian thực. Giải pháp nào cung cấp khả năng truy vấn dữ liệu gần thời gian thực, có khả năng mở rộng với mất dữ liệu tối thiểu?',
    optionsVi: {
      A: 'Publish dữ liệu tới Amazon Kinesis Data Streams. Dùng Kinesis Data Analytics để truy vấn dữ liệu.',
      B: 'Publish dữ liệu tới Amazon Kinesis Data Firehose với Amazon Redshift làm destination. Dùng Amazon Redshift để truy vấn dữ liệu.',
      C: 'Lưu dữ liệu đã nạp trong EC2 instance store. Publish dữ liệu tới Amazon Kinesis Data Firehose với Amazon S3 làm destination. Dùng Amazon Athena để truy vấn dữ liệu.',
      D: 'Lưu dữ liệu đã nạp trong Amazon Elastic Block Store (Amazon EBS) volume. Publish dữ liệu tới Amazon ElastiCache for Redis. Subscribe vào Redis channel để truy vấn dữ liệu.',
    },
  },
  321: {
    questionVi:
      'Kiến trúc sư giải pháp nên làm gì để đảm bảo tất cả object được upload lên Amazon S3 bucket đều được mã hóa?',
    optionsVi: {
      A: 'Cập nhật bucket policy để deny nếu PutObject không có header s3:x-amz-acl.',
      B: 'Cập nhật bucket policy để deny nếu PutObject không có header s3:x-amz-acl đặt thành private.',
      C: 'Cập nhật bucket policy để deny nếu PutObject không có header aws:SecureTransport đặt thành true.',
      D: 'Cập nhật bucket policy để deny nếu PutObject không có header x-amz-server-side-encryption.',
    },
  },
  322: {
    questionVi:
      'Một kiến trúc sư giải pháp đang thiết kế ứng dụng multi-tier cho một công ty. Người dùng ứng dụng upload ảnh từ thiết bị di động. Ứng dụng tạo thumbnail cho mỗi ảnh và trả về thông báo cho người dùng xác nhận ảnh đã được upload thành công. Việc tạo thumbnail có thể mất tới 60 giây, nhưng công ty muốn cung cấp thời gian phản hồi nhanh hơn cho người dùng để thông báo rằng ảnh gốc đã được nhận. Kiến trúc sư giải pháp phải thiết kế ứng dụng để gửi yêu cầu bất đồng bộ tới các tầng ứng dụng khác nhau. Kiến trúc sư giải pháp nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Viết custom AWS Lambda function để tạo thumbnail và thông báo cho người dùng. Dùng quy trình upload ảnh làm event source để gọi Lambda function.',
      B: 'Tạo AWS Step Functions workflow. Cấu hình Step Functions để điều phối giữa các tầng ứng dụng và thông báo cho người dùng khi tạo thumbnail hoàn tất.',
      C: 'Tạo Amazon Simple Queue Service (Amazon SQS) message queue. Khi ảnh được upload, đặt message vào SQS queue để tạo thumbnail. Thông báo cho người dùng qua application message rằng ảnh đã được nhận.',
      D: 'Tạo Amazon Simple Notification Service (Amazon SNS) notification topics và subscriptions. Dùng một subscription với ứng dụng để tạo thumbnail sau khi upload ảnh hoàn tất. Dùng subscription thứ hai để gửi message tới ứng dụng di động của người dùng qua push notification sau khi tạo thumbnail hoàn tất.',
    },
  },
  323: {
    questionVi:
      'Cơ sở của một công ty có đầu đọc thẻ (badge readers) tại mọi lối vào trong tòa nhà. Khi thẻ được quét, đầu đọc gửi message qua HTTPS để cho biết ai đã cố truy cập lối vào cụ thể đó. Kiến trúc sư giải pháp phải thiết kế hệ thống xử lý các message này từ sensor. Giải pháp phải có tính sẵn sàng cao, và kết quả phải sẵn sàng cho đội bảo mật của công ty phân tích. Kiến trúc sư giải pháp nên đề xuất kiến trúc hệ thống nào?',
    optionsVi: {
      A: 'Khởi chạy Amazon EC2 instance làm HTTPS endpoint và xử lý message. Cấu hình EC2 instance lưu kết quả vào Amazon S3 bucket.',
      B: 'Tạo HTTPS endpoint trong Amazon API Gateway. Cấu hình API Gateway endpoint gọi AWS Lambda function để xử lý message và lưu kết quả vào bảng Amazon DynamoDB.',
      C: 'Dùng Amazon Route 53 định tuyến message sensor đến tới AWS Lambda function. Cấu hình Lambda function xử lý message và lưu kết quả vào bảng Amazon DynamoDB.',
      D: 'Tạo gateway VPC endpoint cho Amazon S3. Cấu hình kết nối AWS Site-to-Site VPN từ mạng cơ sở tới VPC để dữ liệu sensor được ghi trực tiếp vào S3 bucket qua VPC endpoint.',
    },
  },
  324: {
    questionVi:
      'Một công ty muốn triển khai kế hoạch disaster recovery cho file storage volume on-premises chính. File storage volume được mount từ thiết bị Internet Small Computer Systems Interface (iSCSI) trên storage server local. File storage volume chứa hàng trăm terabyte (TB) dữ liệu. Công ty muốn đảm bảo người dùng cuối vẫn có quyền truy cập ngay lập tức mọi loại tệp từ hệ thống on-premises mà không gặp độ trễ. Giải pháp nào đáp ứng các yêu cầu này với LƯỢNG THAY ĐỔI ÍT NHẤT tới hạ tầng hiện tại của công ty?',
    optionsVi: {
      A: 'Cấp phát Amazon S3 File Gateway dưới dạng virtual machine (VM) host on-premises. Đặt local cache là 10 TB. Sửa các ứng dụng hiện có để truy cập tệp qua protocol NFS. Để khôi phục sau sự cố, cấp phát Amazon EC2 instance và mount S3 bucket chứa các tệp.',
      B: 'Cấp phát AWS Storage Gateway tape gateway. Dùng giải pháp backup dữ liệu để backup toàn bộ dữ liệu hiện có vào virtual tape library. Cấu hình giải pháp backup dữ liệu chạy hằng đêm sau khi backup ban đầu hoàn tất. Để khôi phục sau sự cố, cấp phát Amazon EC2 instance và khôi phục dữ liệu vào Amazon Elastic Block Store (Amazon EBS) volume từ các volume trong virtual tape library.',
      C: 'Cấp phát AWS Storage Gateway Volume Gateway cached volume. Đặt local cache là 10 TB. Mount Volume Gateway cached volume vào file server hiện có bằng iSCSI, và sao chép toàn bộ tệp vào storage volume. Cấu hình snapshot theo lịch cho storage volume. Để khôi phục sau sự cố, khôi phục snapshot vào Amazon Elastic Block Store (Amazon EBS) volume và gắn EBS volume vào Amazon EC2 instance.',
      D: 'Cấp phát AWS Storage Gateway Volume Gateway stored volume với dung lượng đĩa bằng file storage volume hiện có. Mount Volume Gateway stored volume vào file server hiện có bằng iSCSI, và sao chép toàn bộ tệp vào storage volume. Cấu hình snapshot theo lịch cho storage volume. Để khôi phục sau sự cố, khôi phục snapshot vào Amazon Elastic Block Store (Amazon EBS) volume và gắn EBS volume vào Amazon EC2 instance.',
    },
  },
  325: {
    questionVi:
      'Một công ty host ứng dụng web từ Amazon S3 bucket. Ứng dụng dùng Amazon Cognito làm identity provider để xác thực người dùng và trả về JSON Web Token (JWT) cấp quyền truy cập tới các resource được bảo vệ lưu trong S3 bucket khác. Sau khi triển khai ứng dụng, người dùng báo lỗi và không thể truy cập nội dung được bảo vệ. Kiến trúc sư giải pháp phải giải quyết vấn đề này bằng cách cấp quyền phù hợp để người dùng có thể truy cập nội dung được bảo vệ. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cập nhật Amazon Cognito identity pool để assume IAM role phù hợp cho quyền truy cập nội dung được bảo vệ.',
      B: 'Cập nhật S3 ACL để cho phép ứng dụng truy cập nội dung được bảo vệ.',
      C: 'Triển khai lại ứng dụng lên Amazon S3 để tránh việc eventually consistent reads trong S3 bucket ảnh hưởng tới khả năng người dùng truy cập nội dung được bảo vệ.',
      D: 'Cập nhật Amazon Cognito pool để dùng custom attribute mappings trong identity pool và cấp cho người dùng quyền phù hợp để truy cập nội dung được bảo vệ.',
    },
  },
  326: {
    questionVi:
      'Một công ty hosting ảnh upload các asset lớn lên Amazon S3 Standard buckets. Công ty dùng multipart upload song song bằng S3 APIs và ghi đè nếu object giống nhau được upload lại. Trong 30 ngày đầu sau khi upload, các object sẽ được truy cập thường xuyên. Các object sẽ được truy cập ít hơn sau 30 ngày, nhưng mẫu truy cập cho mỗi object không ổn định. Công ty phải tối ưu chi phí lưu trữ S3 trong khi vẫn duy trì tính sẵn sàng cao và độ bền cho các asset đã lưu. Kiến trúc sư giải pháp nên đề xuất kết hợp hành động nào để đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Chuyển asset sang S3 Intelligent-Tiering sau 30 ngày.',
      B: 'Cấu hình S3 Lifecycle policy để dọn dẹp các multipart upload chưa hoàn tất.',
      C: 'Cấu hình S3 Lifecycle policy để dọn dẹp các delete marker của object đã hết hạn.',
      D: 'Chuyển asset sang S3 Standard-Infrequent Access (S3 Standard-IA) sau 30 ngày.',
      E: 'Chuyển asset sang S3 One Zone-Infrequent Access (S3 One Zone-IA) sau 30 ngày.',
    },
  },
  327: {
    questionVi:
      'Kiến trúc sư giải pháp phải bảo mật mạng VPC host Amazon EC2 instances. Các EC2 instances chứa dữ liệu rất nhạy cảm và chạy trong private subnet. Theo chính sách công ty, EC2 instances chạy trong VPC chỉ được truy cập các software repository bên thứ ba đã được phê duyệt trên internet để cập nhật phần mềm, dùng URL của bên thứ ba đó. Traffic internet khác phải bị chặn. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cập nhật route table cho private subnet để định tuyến outbound traffic tới AWS Network Firewall. Cấu hình domain list rule groups.',
      B: 'Thiết lập AWS WAF web ACL. Tạo bộ rule tùy chỉnh lọc traffic request theo dải địa chỉ IP nguồn và đích.',
      C: 'Triển khai inbound security group rules nghiêm ngặt. Cấu hình outbound rule chỉ cho phép traffic tới các software repository được ủy quyền trên internet bằng cách chỉ định URLs.',
      D: 'Cấu hình Application Load Balancer (ALB) đặt trước EC2 instances. Định hướng toàn bộ outbound traffic tới ALB. Dùng URL-based rule listener trong target group của ALB để truy cập internet outbound.',
    },
  },
  328: {
    questionVi:
      'Một công ty đang host ứng dụng ecommerce ba tầng trên AWS Cloud. Công ty host website trên Amazon S3 và tích hợp website với API xử lý các yêu cầu bán hàng. Công ty host API trên ba Amazon EC2 instances phía sau Application Load Balancer (ALB). API bao gồm nội dung front-end tĩnh và động cùng với các backend worker xử lý yêu cầu bán hàng bất đồng bộ. Công ty dự đoán sẽ có sự tăng đáng kể và đột ngột về số lượng yêu cầu bán hàng trong các sự kiện ra mắt sản phẩm mới. Kiến trúc sư giải pháp nên đề xuất gì để đảm bảo toàn bộ yêu cầu được xử lý thành công?',
    optionsVi: {
      A: 'Thêm Amazon CloudFront distribution cho nội dung động. Tăng số lượng EC2 instances để xử lý traffic tăng.',
      B: 'Thêm Amazon CloudFront distribution cho nội dung tĩnh. Đặt EC2 instances trong Auto Scaling group để khởi chạy instance mới dựa trên network traffic.',
      C: 'Thêm Amazon CloudFront distribution cho nội dung động. Thêm Amazon ElastiCache instance đặt trước ALB để giảm traffic API phải xử lý.',
      D: 'Thêm Amazon CloudFront distribution cho nội dung tĩnh. Thêm Amazon Simple Queue Service (Amazon SQS) queue để nhận request từ website và xử lý sau bởi EC2 instances.',
    },
  },
  329: {
    questionVi:
      'Một cuộc audit bảo mật phát hiện Amazon EC2 instances không được vá thường xuyên. Kiến trúc sư giải pháp cần cung cấp giải pháp chạy quét bảo mật định kỳ trên số lượng lớn EC2 instances. Giải pháp cũng phải vá các EC2 instances theo lịch định kỳ và cung cấp báo cáo tình trạng vá lỗi của mỗi instance. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Thiết lập Amazon Macie để quét EC2 instances tìm lỗ hổng phần mềm. Thiết lập cron job trên mỗi EC2 instance để vá instance theo lịch định kỳ.',
      B: 'Bật Amazon GuardDuty trong tài khoản. Cấu hình GuardDuty quét EC2 instances tìm lỗ hổng phần mềm. Thiết lập AWS Systems Manager Session Manager để vá EC2 instances theo lịch định kỳ.',
      C: 'Thiết lập Amazon Detective để quét EC2 instances tìm lỗ hổng phần mềm. Thiết lập Amazon EventBridge scheduled rule để vá EC2 instances theo lịch định kỳ.',
      D: 'Bật Amazon Inspector trong tài khoản. Cấu hình Amazon Inspector quét EC2 instances tìm lỗ hổng phần mềm. Thiết lập AWS Systems Manager Patch Manager để vá EC2 instances theo lịch định kỳ.',
    },
  },
  330: {
    questionVi:
      'Một công ty đang lên kế hoạch lưu dữ liệu trên Amazon RDS DB instances. Công ty phải mã hóa dữ liệu khi lưu trữ (at rest). Kiến trúc sư giải pháp nên làm gì để đáp ứng yêu cầu này?',
    optionsVi: {
      A: 'Tạo key trong AWS Key Management Service (AWS KMS). Bật mã hóa cho DB instances.',
      B: 'Tạo encryption key. Lưu key trong AWS Secrets Manager. Dùng key để mã hóa DB instances.',
      C: 'Tạo certificate trong AWS Certificate Manager (ACM). Bật SSL/TLS trên DB instances bằng certificate.',
      D: 'Tạo certificate trong AWS Identity and Access Management (IAM). Bật SSL/TLS trên DB instances bằng certificate.',
    },
  },
  331: {
    questionVi:
      'Một công ty phải migrate 20 TB dữ liệu từ data center lên AWS Cloud trong vòng 30 ngày. Băng thông mạng của công ty bị giới hạn ở 15 Mbps và không được vượt quá 70% sử dụng. Kiến trúc sư giải pháp nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng AWS Snowball.',
      B: 'Dùng AWS DataSync.',
      C: 'Dùng kết nối VPN an toàn.',
      D: 'Dùng Amazon S3 Transfer Acceleration.',
    },
  },
  332: {
    questionVi:
      'Một công ty cần cung cấp cho nhân viên quyền truy cập an toàn tới các tệp bảo mật và nhạy cảm. Công ty muốn đảm bảo các tệp chỉ có thể được truy cập bởi người dùng được ủy quyền. Các tệp phải được download an toàn xuống thiết bị của nhân viên. Các tệp được lưu trong Windows file server on-premises. Tuy nhiên, do lượng sử dụng từ xa tăng, file server đang hết dung lượng. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Migrate file server sang Amazon EC2 instance trong public subnet. Cấu hình security group để giới hạn inbound traffic tới địa chỉ IP của nhân viên.',
      B: 'Migrate các tệp sang hệ thống tệp Amazon FSx for Windows File Server. Tích hợp hệ thống tệp Amazon FSx với Active Directory on-premises. Cấu hình AWS Client VPN.',
      C: 'Migrate các tệp sang Amazon S3, và tạo private VPC endpoint. Tạo signed URL để cho phép download.',
      D: 'Migrate các tệp sang Amazon S3, và tạo public VPC endpoint. Cho phép nhân viên đăng nhập bằng AWS IAM Identity Center (AWS Single Sign-On).',
    },
  },
  333: {
    questionVi:
      'Ứng dụng của một công ty chạy trên Amazon EC2 instances phía sau Application Load Balancer (ALB). Các instance chạy trong Amazon EC2 Auto Scaling group trải trên nhiều Availability Zones. Vào ngày đầu mỗi tháng lúc nửa đêm, ứng dụng trở nên chậm hơn nhiều khi batch tính toán tài chính cuối tháng chạy. Điều này khiến CPU utilization của EC2 instances tăng vọt tới 100% ngay lập tức, làm gián đoạn ứng dụng. Kiến trúc sư giải pháp nên đề xuất gì để đảm bảo ứng dụng có thể xử lý workload và tránh downtime?',
    optionsVi: {
      A: 'Cấu hình Amazon CloudFront distribution đặt trước ALB.',
      B: 'Cấu hình EC2 Auto Scaling simple scaling policy dựa trên CPU utilization.',
      C: 'Cấu hình EC2 Auto Scaling scheduled scaling policy dựa trên lịch hằng tháng.',
      D: 'Cấu hình Amazon ElastiCache để giảm một phần workload khỏi EC2 instances.',
    },
  },
  334: {
    questionVi:
      'Một công ty muốn cho phép khách hàng dùng Microsoft Active Directory on-premises để download tệp được lưu trong Amazon S3. Ứng dụng của khách hàng dùng SFTP client để download tệp. Giải pháp nào đáp ứng các yêu cầu này với công sức vận hành THẤP NHẤT và không cần thay đổi ứng dụng của khách hàng?',
    optionsVi: {
      A: 'Thiết lập AWS Transfer Family với SFTP cho Amazon S3. Cấu hình xác thực Active Directory tích hợp.',
      B: 'Thiết lập AWS Database Migration Service (AWS DMS) để đồng bộ client on-premises với Amazon S3. Cấu hình xác thực Active Directory tích hợp.',
      C: 'Thiết lập AWS DataSync để đồng bộ giữa vị trí on-premises và vị trí S3 bằng AWS IAM Identity Center (AWS Single Sign-On).',
      D: 'Thiết lập Windows Amazon EC2 instance với SFTP để kết nối client on-premises với Amazon S3. Tích hợp AWS Identity and Access Management (IAM).',
    },
  },
  335: {
    questionVi:
      'Một công ty đang gặp sự tăng nhu cầu đột ngột. Công ty cần cấp phát Amazon EC2 instances lớn từ Amazon Machine Image (AMI). Các instance sẽ chạy trong Auto Scaling group. Công ty cần giải pháp cung cấp độ trễ khởi tạo tối thiểu để đáp ứng nhu cầu. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng lệnh aws ec2 register-image để tạo AMI từ snapshot. Dùng AWS Step Functions để thay AMI trong Auto Scaling group.',
      B: 'Bật Amazon Elastic Block Store (Amazon EBS) fast snapshot restore trên snapshot. Cấp phát AMI bằng snapshot. Thay AMI trong Auto Scaling group bằng AMI mới.',
      C: 'Bật tạo AMI và định nghĩa lifecycle rules trong Amazon Data Lifecycle Manager (Amazon DLM). Tạo AWS Lambda function sửa AMI trong Auto Scaling group.',
      D: 'Dùng Amazon EventBridge gọi AWS Backup lifecycle policies để cấp phát AMIs. Cấu hình Auto Scaling group capacity limits làm event source trong EventBridge.',
    },
  },
  336: {
    questionVi:
      'Một công ty host ứng dụng web multi-tier dùng Amazon Aurora MySQL DB cluster để lưu trữ. Tầng ứng dụng được host trên Amazon EC2 instances. Hướng dẫn bảo mật IT của công ty yêu cầu thông tin đăng nhập database phải được mã hóa và xoay vòng mỗi 14 ngày. Kiến trúc sư giải pháp nên làm gì để đáp ứng yêu cầu này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo AWS Key Management Service (AWS KMS) encryption key mới. Dùng AWS Secrets Manager tạo secret mới dùng KMS key với thông tin đăng nhập phù hợp. Liên kết secret với Aurora DB cluster. Cấu hình custom rotation period 14 ngày.',
      B: 'Tạo hai parameter trong AWS Systems Manager Parameter Store: một cho user name dạng string parameter và một dùng SecureString type cho password. Chọn AWS Key Management Service (AWS KMS) encryption cho password parameter, và nạp các parameter này trong tầng ứng dụng. Triển khai AWS Lambda function xoay vòng password mỗi 14 ngày.',
      C: 'Lưu tệp chứa thông tin đăng nhập trong hệ thống tệp Amazon Elastic File System (Amazon EFS) được mã hóa bằng AWS Key Management Service (AWS KMS). Mount hệ thống tệp EFS trên tất cả EC2 instances của tầng ứng dụng. Giới hạn quyền truy cập tệp trên hệ thống tệp để ứng dụng chỉ có thể đọc tệp và chỉ super user mới có thể sửa tệp. Triển khai AWS Lambda function xoay vòng key trong Aurora mỗi 14 ngày và ghi thông tin đăng nhập mới vào tệp.',
      D: 'Lưu tệp chứa thông tin đăng nhập trong S3 bucket được mã hóa bằng AWS Key Management Service (AWS KMS) mà ứng dụng dùng để nạp thông tin đăng nhập. Download tệp về ứng dụng thường xuyên để đảm bảo dùng đúng thông tin đăng nhập. Triển khai AWS Lambda function xoay vòng thông tin đăng nhập Aurora mỗi 14 ngày và upload thông tin đăng nhập này vào tệp trong S3 bucket.',
    },
  },
};

const out = writeBatch(12, 312, 336, T);
console.log('Wrote', out);
