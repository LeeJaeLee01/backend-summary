/** Options VI Q312–386 (batches 12–14) */

/** @type {Record<number, {questionVi: string, optionsVi: Record<string,string>}>} */
const T = {
  312: {
    questionVi:
      'Một công ty có ứng dụng chạy trên nhiều Amazon EC2 instance. Mỗi EC2 instance có nhiều Amazon Elastic Block Store (Amazon EBS) data volume đính kèm. Cấu hình EC2 instance và dữ liệu của ứng dụng cần được backup mỗi đêm. Ứng dụng cũng cần có khả năng khôi phục ở một AWS Region khác. Giải pháp nào đáp ứng các yêu cầu này theo cách VẬN HÀNH HIỆU QUẢ NHẤT?',
    optionsVi: {
      A: 'Viết AWS Lambda function lên lịch snapshot EBS volume của ứng dụng mỗi đêm và sao chép snapshot sang Region khác.',
      B: 'Tạo backup plan bằng AWS Backup để thực hiện backup mỗi đêm. Sao chép backup sang Region khác. Thêm EC2 instance của ứng dụng làm resource.',
      C: 'Tạo backup plan bằng AWS Backup để thực hiện backup mỗi đêm. Sao chép backup sang Region khác. Thêm EBS volume của ứng dụng làm resource.',
      D: 'Viết AWS Lambda function lên lịch snapshot EBS volume của ứng dụng mỗi đêm và sao chép snapshot sang Availability Zone khác.',
    },
  },
  313: {
    questionVi:
      'Một công ty đang xây dựng ứng dụng di động trên AWS. Công ty muốn mở rộng phạm vi tới hàng triệu người dùng. Công ty cần xây dựng nền tảng để người dùng được ủy quyền có thể xem nội dung của công ty trên thiết bị di động. Solutions architect nên đề xuất gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Publish nội dung lên Amazon S3 bucket công khai. Dùng AWS Key Management Service (AWS KMS) key để stream nội dung.',
      B: 'Thiết lập IPsec VPN giữa ứng dụng di động và môi trường AWS để stream nội dung.',
      C: 'Dùng Amazon CloudFront. Cung cấp signed URL để stream nội dung.',
      D: 'Thiết lập AWS Client VPN giữa ứng dụng di động và môi trường AWS để stream nội dung.',
    },
  },
  314: {
    questionVi:
      'Một công ty có cơ sở dữ liệu MySQL on-premises được đội sales toàn cầu sử dụng với mẫu truy cập không thường xuyên. Đội sales yêu cầu cơ sở dữ liệu có downtime tối thiểu. Database administrator muốn migrate cơ sở dữ liệu này lên AWS mà không chọn loại instance cụ thể, dự đoán số người dùng sẽ tăng trong tương lai. Solutions architect nên đề xuất dịch vụ nào?',
    optionsVi: {
      A: 'Amazon Aurora MySQL',
      B: 'Amazon Aurora Serverless for MySQL',
      C: 'Amazon Redshift Spectrum',
      D: 'Amazon RDS for MySQL',
    },
  },
  315: {
    questionVi:
      'Một công ty gặp sự cố vi phạm ảnh hưởng đến nhiều ứng dụng trong data center on-premises. Kẻ tấn công đã lợi dụng lỗ hổng trong các ứng dụng tùy chỉnh chạy trên server. Công ty hiện đang migrate ứng dụng để chạy trên Amazon EC2 instance. Công ty muốn triển khai giải pháp chủ động quét lỗ hổng trên EC2 instance và gửi báo cáo chi tiết kết quả. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Triển khai AWS Shield để quét lỗ hổng trên EC2 instance. Tạo AWS Lambda function ghi log kết quả vào AWS CloudTrail.',
      B: 'Triển khai Amazon Macie và AWS Lambda function để quét lỗ hổng trên EC2 instance. Ghi log kết quả vào AWS CloudTrail.',
      C: 'Bật Amazon GuardDuty. Triển khai GuardDuty agent lên EC2 instance. Cấu hình AWS Lambda function tự động tạo và phân phối báo cáo chi tiết kết quả.',
      D: 'Bật Amazon Inspector. Triển khai Amazon Inspector agent lên EC2 instance. Cấu hình AWS Lambda function tự động tạo và phân phối báo cáo chi tiết kết quả.',
    },
  },
  316: {
    questionVi:
      'Một công ty dùng Amazon EC2 instance để chạy script poll và xử lý message trong Amazon Simple Queue Service (Amazon SQS) queue. Công ty muốn giảm chi phí vận hành đồng thời duy trì khả năng xử lý số lượng message ngày càng tăng được thêm vào queue. Solutions architect nên đề xuất gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tăng kích thước EC2 instance để xử lý message nhanh hơn.',
      B: 'Dùng Amazon EventBridge để tắt EC2 instance khi instance không được sử dụng hết công suất.',
      C: 'Migrate script trên EC2 instance sang AWS Lambda function với runtime phù hợp.',
      D: 'Dùng AWS Systems Manager Run Command để chạy script theo yêu cầu.',
    },
  },
  317: {
    questionVi:
      'Một công ty dùng ứng dụng legacy để tạo dữ liệu ở định dạng CSV. Ứng dụng legacy lưu dữ liệu đầu ra trong Amazon S3. Công ty đang triển khai ứng dụng commercial off-the-shelf (COTS) mới có thể thực hiện truy vấn SQL phức tạp để phân tích dữ liệu lưu trong Amazon Redshift và Amazon S3 mà thôi. Tuy nhiên, ứng dụng COTS không thể xử lý tệp .csv mà ứng dụng legacy tạo ra. Công ty không thể cập nhật ứng dụng legacy để tạo dữ liệu ở định dạng khác. Công ty cần triển khai giải pháp để ứng dụng COTS có thể dùng dữ liệu mà ứng dụng legacy tạo ra. Giải pháp nào đáp ứng các yêu cầu này với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo AWS Glue extract, transform, and load (ETL) job chạy theo lịch. Cấu hình ETL job xử lý tệp .csv và lưu dữ liệu đã xử lý trong Amazon Redshift.',
      B: 'Phát triển Python script chạy trên Amazon EC2 instance để chuyển tệp .csv sang tệp .sql. Gọi Python script theo lịch cron để lưu tệp đầu ra trong Amazon S3.',
      C: 'Tạo AWS Lambda function và bảng Amazon DynamoDB. Dùng S3 event để gọi Lambda function. Cấu hình Lambda function thực hiện extract, transform, and load (ETL) job xử lý tệp .csv và lưu dữ liệu đã xử lý trong bảng DynamoDB.',
      D: 'Dùng Amazon EventBridge khởi chạy Amazon EMR cluster theo lịch hàng tuần. Cấu hình EMR cluster thực hiện extract, transform, and load (ETL) job xử lý tệp .csv và lưu dữ liệu đã xử lý trong bảng Amazon Redshift.',
    },
  },
  318: {
    questionVi:
      'Một công ty gần đây đã migrate toàn bộ môi trường IT lên AWS Cloud. Công ty phát hiện người dùng đang cấp phát Amazon EC2 instance quá khổ và chỉnh sửa security group rule mà không dùng quy trình change control phù hợp. Solutions architect phải xây dựng chiến lược theo dõi và kiểm toán các thay đổi inventory và cấu hình này. Solutions architect nên kết hợp hành động nào để đáp ứng yêu cầu? (Chọn hai.)',
    optionsVi: {
      A: 'Bật AWS CloudTrail và dùng để kiểm toán.',
      B: 'Dùng data lifecycle policy cho Amazon EC2 instance.',
      C: 'Bật AWS Trusted Advisor và tham chiếu security dashboard.',
      D: 'Bật AWS Config và tạo rule phục vụ kiểm toán và tuân thủ.',
      E: 'Khôi phục cấu hình resource trước đó bằng AWS CloudFormation template.',
    },
  },
  319: {
    questionVi:
      'Một công ty có hàng trăm Amazon EC2 Linux instance trên AWS Cloud. Quản trị viên hệ thống đã dùng SSH key chia sẻ để quản lý các instance. Sau một cuộc kiểm toán gần đây, đội bảo mật của công ty yêu cầu loại bỏ mọi key chia sẻ. Solutions architect phải thiết kế giải pháp cung cấp quyền truy cập an toàn tới EC2 instance. Giải pháp nào đáp ứng yêu cầu này với công sức quản trị ÍT NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Systems Manager Session Manager để kết nối tới EC2 instance.',
      B: 'Dùng AWS Security Token Service (AWS STS) để tạo SSH key dùng một lần theo yêu cầu.',
      C: 'Cho phép truy cập SSH chia sẻ tới một nhóm bastion instance. Cấu hình mọi instance khác chỉ cho phép truy cập SSH từ bastion instance.',
      D: 'Dùng Amazon Cognito custom authorizer để xác thực người dùng. Gọi AWS Lambda function để tạo SSH key tạm thời.',
    },
  },
  320: {
    questionVi:
      'Một công ty dùng một nhóm Amazon EC2 instance để nhận dữ liệu (ingest) từ các nguồn dữ liệu on-premises. Dữ liệu ở định dạng JSON và tốc độ ingest có thể lên tới 1 MB/giây. Khi EC2 instance khởi động lại, dữ liệu đang truyền (in-flight) bị mất. Đội data science của công ty muốn truy vấn dữ liệu đã ingest theo thời gian gần thực (near-real time). Giải pháp nào cung cấp khả năng truy vấn dữ liệu gần thực, có thể mở rộng với tổn thất dữ liệu tối thiểu?',
    optionsVi: {
      A: 'Publish dữ liệu lên Amazon Kinesis Data Streams. Dùng Kinesis Data Analytics để truy vấn dữ liệu.',
      B: 'Publish dữ liệu lên Amazon Kinesis Data Firehose với Amazon Redshift làm đích. Dùng Amazon Redshift để truy vấn dữ liệu.',
      C: 'Lưu dữ liệu đã ingest trong EC2 instance store. Publish dữ liệu lên Amazon Kinesis Data Firehose với Amazon S3 làm đích. Dùng Amazon Athena để truy vấn dữ liệu.',
      D: 'Lưu dữ liệu đã ingest trong Amazon Elastic Block Store (Amazon EBS) volume. Publish dữ liệu lên Amazon ElastiCache for Redis. Subscribe vào Redis channel để truy vấn dữ liệu.',
    },
  },
  321: {
    questionVi:
      'Solutions architect nên làm gì để đảm bảo mọi object upload lên Amazon S3 bucket đều được mã hóa?',
    optionsVi: {
      A: 'Cập nhật bucket policy để deny nếu PutObject không có header s3:x-amz-acl.',
      B: 'Cập nhật bucket policy để deny nếu PutObject không có header s3:x-amz-acl được đặt thành private.',
      C: 'Cập nhật bucket policy để deny nếu PutObject không có header aws:SecureTransport được đặt thành true.',
      D: 'Cập nhật bucket policy để deny nếu PutObject không có header x-amz-server-side-encryption.',
    },
  },
  322: {
    questionVi:
      'Solutions architect đang thiết kế ứng dụng multi-tier cho một công ty. Người dùng ứng dụng upload ảnh từ thiết bị di động. Ứng dụng tạo thumbnail cho mỗi ảnh và trả về thông báo cho người dùng xác nhận ảnh đã upload thành công. Việc tạo thumbnail có thể mất tới 60 giây, nhưng công ty muốn phản hồi nhanh hơn cho người dùng để thông báo ảnh gốc đã được nhận. Solutions architect phải thiết kế ứng dụng gửi yêu cầu bất đồng bộ (asynchronously) tới các tầng ứng dụng khác nhau. Solutions architect nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Viết AWS Lambda function tùy chỉnh để tạo thumbnail và thông báo người dùng. Dùng quy trình upload ảnh làm event source để gọi Lambda function.',
      B: 'Tạo AWS Step Functions workflow. Cấu hình Step Functions xử lý orchestration giữa các tầng ứng dụng và thông báo người dùng khi tạo thumbnail hoàn tất.',
      C: 'Tạo Amazon Simple Queue Service (Amazon SQS) message queue. Khi ảnh được upload, đặt message vào SQS queue để tạo thumbnail. Thông báo người dùng qua thông báo ứng dụng rằng ảnh đã được nhận.',
      D: 'Tạo Amazon Simple Notification Service (Amazon SNS) notification topic và subscription. Dùng một subscription để ứng dụng tạo thumbnail sau khi upload ảnh hoàn tất. Dùng subscription thứ hai để gửi thông báo tới ứng dụng di động của người dùng qua push notification sau khi tạo thumbnail hoàn tất.',
    },
  },
  323: {
    questionVi:
      'Cơ sở của một công ty có đầu đọc thẻ (badge reader) tại mọi lối vào trong tòa nhà. Khi thẻ được quét, đầu đọc gửi message qua HTTPS để cho biết ai đã cố truy cập lối vào đó. Solutions architect phải thiết kế hệ thống xử lý các message này từ sensor. Giải pháp phải có tính sẵn sàng cao và kết quả phải sẵn sàng cho đội bảo mật của công ty phân tích. Kiến trúc hệ thống nào solutions architect nên đề xuất?',
    optionsVi: {
      A: 'Khởi chạy Amazon EC2 instance làm endpoint HTTPS và xử lý message. Cấu hình EC2 instance lưu kết quả vào Amazon S3 bucket.',
      B: 'Tạo endpoint HTTPS trong Amazon API Gateway. Cấu hình API Gateway endpoint gọi AWS Lambda function để xử lý message và lưu kết quả vào bảng Amazon DynamoDB.',
      C: 'Dùng Amazon Route 53 để định hướng message sensor đến tới AWS Lambda function. Cấu hình Lambda function xử lý message và lưu kết quả vào bảng Amazon DynamoDB.',
      D: 'Tạo gateway VPC endpoint cho Amazon S3. Cấu hình kết nối AWS Site-to-Site VPN từ mạng cơ sở tới VPC để dữ liệu sensor được ghi trực tiếp vào S3 bucket qua VPC endpoint.',
    },
  },
  324: {
    questionVi:
      'Một công ty muốn triển khai kế hoạch disaster recovery cho volume lưu trữ tệp on-premises chính của mình. Volume lưu trữ tệp được mount từ thiết bị Internet Small Computer Systems Interface (iSCSI) trên storage server nội bộ. Volume lưu trữ tệp chứa hàng trăm terabyte (TB) dữ liệu. Công ty muốn đảm bảo người dùng cuối luôn có quyền truy cập ngay lập tức tới mọi loại tệp từ hệ thống on-premises mà không gặp độ trễ. Giải pháp nào đáp ứng các yêu cầu này với LƯỢNG THAY ĐỔI ÍT NHẤT tới hạ tầng hiện có của công ty?',
    optionsVi: {
      A: 'Cấp phát Amazon S3 File Gateway dưới dạng virtual machine (VM) host on-premises. Đặt local cache là 10 TB. Chỉnh ứng dụng hiện có để truy cập tệp qua protocol NFS. Để khôi phục sau sự cố, cấp phát Amazon EC2 instance và mount S3 bucket chứa các tệp.',
      B: 'Cấp phát AWS Storage Gateway tape gateway. Dùng giải pháp backup dữ liệu để backup toàn bộ dữ liệu hiện có vào virtual tape library. Cấu hình giải pháp backup dữ liệu chạy mỗi đêm sau khi backup ban đầu hoàn tất. Để khôi phục sau sự cố, cấp phát Amazon EC2 instance và khôi phục dữ liệu vào Amazon Elastic Block Store (Amazon EBS) volume từ các volume trong virtual tape library.',
      C: 'Cấp phát AWS Storage Gateway Volume Gateway cached volume. Đặt local cache là 10 TB. Mount Volume Gateway cached volume vào file server hiện có bằng iSCSI, và sao chép toàn bộ tệp vào storage volume. Cấu hình snapshot theo lịch cho storage volume. Để khôi phục sau sự cố, khôi phục snapshot vào Amazon Elastic Block Store (Amazon EBS) volume và gắn EBS volume vào Amazon EC2 instance.',
      D: 'Cấp phát AWS Storage Gateway Volume Gateway stored volume với dung lượng đĩa bằng volume lưu trữ tệp hiện có. Mount Volume Gateway stored volume vào file server hiện có bằng iSCSI, và sao chép toàn bộ tệp vào storage volume. Cấu hình snapshot theo lịch cho storage volume. Để khôi phục sau sự cố, khôi phục snapshot vào Amazon Elastic Block Store (Amazon EBS) volume và gắn EBS volume vào Amazon EC2 instance.',
    },
  },
  325: {
    questionVi:
      'Một công ty host ứng dụng web từ Amazon S3 bucket. Ứng dụng dùng Amazon Cognito làm identity provider để xác thực người dùng và trả về JSON Web Token (JWT) cấp quyền truy cập tài nguyên được bảo vệ lưu trong một S3 bucket khác. Sau khi triển khai ứng dụng, người dùng báo lỗi và không thể truy cập nội dung được bảo vệ. Solutions architect phải khắc phục vấn đề này bằng cách cấp quyền phù hợp để người dùng có thể truy cập nội dung được bảo vệ. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cập nhật Amazon Cognito identity pool để assume IAM role phù hợp để truy cập nội dung được bảo vệ.',
      B: 'Cập nhật S3 ACL để cho phép ứng dụng truy cập nội dung được bảo vệ.',
      C: 'Redeploy ứng dụng lên Amazon S3 để ngăn eventually consistent read trong S3 bucket ảnh hưởng khả năng người dùng truy cập nội dung được bảo vệ.',
      D: 'Cập nhật Amazon Cognito pool để dùng custom attribute mapping trong identity pool và cấp cho người dùng quyền phù hợp truy cập nội dung được bảo vệ.',
    },
  },
  326: {
    questionVi:
      'Một công ty hosting ảnh upload asset lớn lên Amazon S3 Standard bucket. Công ty dùng multipart upload song song bằng S3 API và ghi đè nếu object giống nhau được upload lại. Trong 30 ngày đầu sau khi upload, object được truy cập thường xuyên. Sau 30 ngày object được truy cập ít hơn, nhưng mẫu truy cập cho mỗi object không ổn định. Công ty phải tối ưu chi phí lưu trữ S3 đồng thời duy trì tính sẵn sàng cao và độ bền của asset đã lưu. Solutions architect nên kết hợp hành động nào để đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Chuyển asset sang S3 Intelligent-Tiering sau 30 ngày.',
      B: 'Cấu hình S3 Lifecycle policy dọn dẹp multipart upload chưa hoàn tất.',
      C: 'Cấu hình S3 Lifecycle policy dọn dẹp delete marker của object đã hết hạn.',
      D: 'Chuyển asset sang S3 Standard-Infrequent Access (S3 Standard-IA) sau 30 ngày.',
      E: 'Chuyển asset sang S3 One Zone-Infrequent Access (S3 One Zone-IA) sau 30 ngày.',
    },
  },
  327: {
    questionVi:
      'Solutions architect phải bảo mật một VPC network host Amazon EC2 instance. Các EC2 instance chứa dữ liệu rất nhạy cảm và chạy trong private subnet. Theo chính sách công ty, EC2 instance chạy trong VPC chỉ được truy cập các software repository bên thứ ba đã được phê duyệt trên internet để cập nhật sản phẩm phần mềm bằng URL của bên thứ ba đó. Mọi traffic internet khác phải bị chặn. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cập nhật route table của private subnet để định tuyến outbound traffic tới AWS Network Firewall. Cấu hình domain list rule group.',
      B: 'Thiết lập AWS WAF web ACL. Tạo bộ rule tùy chỉnh lọc yêu cầu traffic theo dải địa chỉ IP nguồn và đích.',
      C: 'Triển khai security group rule inbound nghiêm ngặt. Cấu hình rule outbound chỉ cho phép traffic tới các software repository được ủy quyền trên internet bằng cách chỉ định URL.',
      D: 'Cấu hình Application Load Balancer (ALB) phía trước EC2 instance. Chuyển toàn bộ outbound traffic tới ALB. Dùng URL-based rule listener trong target group của ALB để truy cập internet outbound.',
    },
  },
  328: {
    questionVi:
      'Một công ty host ứng dụng ecommerce ba tầng trên AWS Cloud. Công ty host website trên Amazon S3 và tích hợp website với API xử lý yêu cầu bán hàng. Công ty host API trên ba Amazon EC2 instance phía sau Application Load Balancer (ALB). API gồm nội dung front-end tĩnh và động cùng với backend worker xử lý yêu cầu bán hàng bất đồng bộ. Công ty dự kiến số lượng yêu cầu bán hàng tăng đột biến và đáng kể trong các sự kiện ra mắt sản phẩm mới. Solutions architect nên đề xuất gì để đảm bảo mọi yêu cầu được xử lý thành công?',
    optionsVi: {
      A: 'Thêm Amazon CloudFront distribution cho nội dung động. Tăng số EC2 instance để xử lý traffic tăng.',
      B: 'Thêm Amazon CloudFront distribution cho nội dung tĩnh. Đặt EC2 instance trong Auto Scaling group để khởi chạy instance mới theo network traffic.',
      C: 'Thêm Amazon CloudFront distribution cho nội dung động. Thêm Amazon ElastiCache instance phía trước ALB để giảm traffic mà API phải xử lý.',
      D: 'Thêm Amazon CloudFront distribution cho nội dung tĩnh. Thêm Amazon Simple Queue Service (Amazon SQS) queue để nhận yêu cầu từ website xử lý sau bởi EC2 instance.',
    },
  },
  329: {
    questionVi:
      'Một cuộc kiểm toán bảo mật phát hiện Amazon EC2 instance không được vá thường xuyên. Solutions architect cần cung cấp giải pháp chạy quét bảo mật định kỳ trên số lượng lớn EC2 instance. Giải pháp cũng cần vá EC2 instance theo lịch định kỳ và cung cấp báo cáo trạng thái vá của mỗi instance. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Thiết lập Amazon Macie để quét lỗ hổng phần mềm trên EC2 instance. Thiết lập cron job trên mỗi EC2 instance để vá instance theo lịch định kỳ.',
      B: 'Bật Amazon GuardDuty trong tài khoản. Cấu hình GuardDuty quét lỗ hổng phần mềm trên EC2 instance. Thiết lập AWS Systems Manager Session Manager để vá EC2 instance theo lịch định kỳ.',
      C: 'Thiết lập Amazon Detective để quét lỗ hổng phần mềm trên EC2 instance. Thiết lập Amazon EventBridge scheduled rule để vá EC2 instance theo lịch định kỳ.',
      D: 'Bật Amazon Inspector trong tài khoản. Cấu hình Amazon Inspector quét lỗ hổng phần mềm trên EC2 instance. Thiết lập AWS Systems Manager Patch Manager để vá EC2 instance theo lịch định kỳ.',
    },
  },
  330: {
    questionVi:
      'Một công ty dự định lưu dữ liệu trong Amazon RDS DB instance. Công ty phải mã hóa dữ liệu khi lưu trữ (at rest). Solutions architect nên làm gì để đáp ứng yêu cầu này?',
    optionsVi: {
      A: 'Tạo key trong AWS Key Management Service (AWS KMS). Bật encryption cho DB instance.',
      B: 'Tạo encryption key. Lưu key trong AWS Secrets Manager. Dùng key để mã hóa DB instance.',
      C: 'Tạo certificate trong AWS Certificate Manager (ACM). Bật SSL/TLS cho DB instance bằng certificate.',
      D: 'Tạo certificate trong AWS Identity and Access Management (IAM). Bật SSL/TLS cho DB instance bằng certificate.',
    },
  },
  331: {
    questionVi:
      'Một công ty phải migrate 20 TB dữ liệu từ data center lên AWS Cloud trong vòng 30 ngày. Băng thông mạng của công ty giới hạn ở 15 Mbps và không được vượt quá 70% mức sử dụng. Solutions architect nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng AWS Snowball.',
      B: 'Dùng AWS DataSync.',
      C: 'Dùng kết nối VPN an toàn.',
      D: 'Dùng Amazon S3 Transfer Acceleration.',
    },
  },
  332: {
    questionVi:
      'Một công ty cần cung cấp cho nhân viên quyền truy cập an toàn tới tệp bí mật và nhạy cảm. Công ty muốn đảm bảo tệp chỉ có thể truy cập bởi người dùng được ủy quyền. Tệp phải được download an toàn xuống thiết bị của nhân viên. Tệp được lưu trên Windows file server on-premises. Tuy nhiên, do nhu cầu sử dụng từ xa tăng, file server đang hết dung lượng. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Migrate file server sang Amazon EC2 instance trong public subnet. Cấu hình security group giới hạn inbound traffic tới địa chỉ IP của nhân viên.',
      B: 'Migrate tệp sang hệ thống tệp Amazon FSx for Windows File Server. Tích hợp hệ thống tệp Amazon FSx với Active Directory on-premises. Cấu hình AWS Client VPN.',
      C: 'Migrate tệp sang Amazon S3, và tạo private VPC endpoint. Tạo signed URL để cho phép download.',
      D: 'Migrate tệp sang Amazon S3, và tạo public VPC endpoint. Cho phép nhân viên đăng nhập bằng AWS IAM Identity Center (AWS Single Sign-On).',
    },
  },
  333: {
    questionVi:
      'Ứng dụng của một công ty chạy trên Amazon EC2 instance phía sau Application Load Balancer (ALB). Các instance chạy trong Amazon EC2 Auto Scaling group trên nhiều Availability Zone. Vào ngày đầu mỗi tháng lúc nửa đêm, ứng dụng chạy chậm hơn nhiều khi batch tính toán tài chính cuối tháng chạy. Điều này khiến CPU utilization của EC2 instance ngay lập tức đạt đỉnh 100%, làm gián đoạn ứng dụng. Solutions architect nên đề xuất gì để đảm bảo ứng dụng có thể xử lý workload và tránh downtime?',
    optionsVi: {
      A: 'Cấu hình Amazon CloudFront distribution phía trước ALB.',
      B: 'Cấu hình EC2 Auto Scaling simple scaling policy theo metric CPU utilization.',
      C: 'Cấu hình EC2 Auto Scaling scheduled scaling policy theo lịch hàng tháng.',
      D: 'Cấu hình Amazon ElastiCache để giảm tải khỏi EC2 instance.',
    },
  },
  334: {
    questionVi:
      'Một công ty muốn cung cấp cho khách hàng khả năng dùng Microsoft Active Directory on-premises để download tệp lưu trong Amazon S3. Ứng dụng của khách hàng dùng SFTP client để download tệp. Giải pháp nào đáp ứng các yêu cầu này với chi phí vận hành THẤP NHẤT và không cần thay đổi ứng dụng của khách hàng?',
    optionsVi: {
      A: 'Thiết lập AWS Transfer Family với SFTP cho Amazon S3. Cấu hình xác thực Active Directory tích hợp.',
      B: 'Thiết lập AWS Database Migration Service (AWS DMS) để đồng bộ client on-premises với Amazon S3. Cấu hình xác thực Active Directory tích hợp.',
      C: 'Thiết lập AWS DataSync để đồng bộ giữa vị trí on-premises và vị trí S3 bằng AWS IAM Identity Center (AWS Single Sign-On).',
      D: 'Thiết lập Windows Amazon EC2 instance với SFTP để kết nối client on-premises với Amazon S3. Tích hợp AWS Identity and Access Management (IAM).',
    },
  },
  335: {
    questionVi:
      'Một công ty đang gặp nhu cầu tăng đột ngột. Công ty cần cấp phát Amazon EC2 instance lớn từ Amazon Machine Image (AMI). Các instance sẽ chạy trong Auto Scaling group. Công ty cần giải pháp cung cấp độ trễ khởi tạo tối thiểu để đáp ứng nhu cầu. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng lệnh aws ec2 register-image để tạo AMI từ snapshot. Dùng AWS Step Functions để thay AMI trong Auto Scaling group.',
      B: 'Bật Amazon Elastic Block Store (Amazon EBS) fast snapshot restore trên snapshot. Cấp phát AMI bằng snapshot. Thay AMI trong Auto Scaling group bằng AMI mới.',
      C: 'Bật tạo AMI và định nghĩa lifecycle rule trong Amazon Data Lifecycle Manager (Amazon DLM). Tạo AWS Lambda function chỉnh sửa AMI trong Auto Scaling group.',
      D: 'Dùng Amazon EventBridge để gọi AWS Backup lifecycle policy cấp phát AMI. Cấu hình giới hạn capacity của Auto Scaling group làm event source trong EventBridge.',
    },
  },
  336: {
    questionVi:
      'Một công ty host ứng dụng web multi-tier dùng Amazon Aurora MySQL DB cluster để lưu trữ. Tầng ứng dụng được host trên Amazon EC2 instance. Hướng dẫn bảo mật IT của công ty yêu cầu thông tin đăng nhập cơ sở dữ liệu phải được mã hóa và xoay vòng mỗi 14 ngày. Solutions architect nên làm gì để đáp ứng yêu cầu này với công sức vận hành ÍT NHẤT?',
    optionsVi: {
      A: 'Tạo AWS Key Management Service (AWS KMS) encryption key mới. Dùng AWS Secrets Manager để tạo secret mới sử dụng KMS key với thông tin đăng nhập phù hợp. Liên kết secret với Aurora DB cluster. Cấu hình chu kỳ xoay vòng tùy chỉnh 14 ngày.',
      B: 'Tạo hai parameter trong AWS Systems Manager Parameter Store: một cho user name dạng string parameter và một dùng loại SecureString cho password. Chọn AWS Key Management Service (AWS KMS) encryption cho password parameter, và nạp các parameter này vào tầng ứng dụng. Triển khai AWS Lambda function xoay vòng password mỗi 14 ngày.',
      C: 'Lưu tệp chứa thông tin đăng nhập trong hệ thống tệp Amazon Elastic File System (Amazon EFS) đã mã hóa bằng AWS Key Management Service (AWS KMS). Mount hệ thống tệp EFS trên mọi EC2 instance của tầng ứng dụng. Giới hạn quyền truy cập tệp trên hệ thống tệp sao cho ứng dụng chỉ đọc được tệp và chỉ super user mới sửa được tệp. Triển khai AWS Lambda function xoay vòng key trong Aurora mỗi 14 ngày và ghi thông tin đăng nhập mới vào tệp.',
      D: 'Lưu tệp chứa thông tin đăng nhập trong Amazon S3 bucket đã mã hóa bằng AWS Key Management Service (AWS KMS) mà ứng dụng dùng để nạp thông tin đăng nhập. Download tệp về ứng dụng thường xuyên để đảm bảo dùng đúng thông tin đăng nhập. Triển khai AWS Lambda function xoay vòng thông tin đăng nhập Aurora mỗi 14 ngày và upload thông tin đăng nhập này lên tệp trong S3 bucket.',
    },
  },
  337: {
    questionVi:
      'Một công ty đã triển khai ứng dụng web trên AWS. Công ty host backend database trên Amazon RDS for MySQL với một primary DB instance và năm read replica để hỗ trợ nhu cầu mở rộng. Read replica không được lag quá 1 giây so với primary DB instance. Cơ sở dữ liệu thường xuyên chạy stored procedure theo lịch. Khi traffic trên website tăng, các replica gặp lag bổ sung trong giờ cao điểm. Solutions architect phải giảm lag replication tối đa có thể. Solutions architect phải giảm tối thiểu thay đổi code ứng dụng và giảm tối thiểu chi phí vận hành liên tục. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Migrate cơ sở dữ liệu sang Amazon Aurora MySQL. Thay read replica bằng Aurora Replica, và cấu hình Aurora Auto Scaling. Thay stored procedure bằng hàm native của Aurora MySQL.',
      B: 'Triển khai Amazon ElastiCache for Redis cluster phía trước cơ sở dữ liệu. Chỉnh ứng dụng kiểm tra cache trước khi ứng dụng truy vấn cơ sở dữ liệu. Thay stored procedure bằng AWS Lambda function.',
      C: 'Migrate cơ sở dữ liệu sang cơ sở dữ liệu MySQL chạy trên Amazon EC2 instance. Chọn EC2 instance lớn, tối ưu compute cho toàn bộ replica node. Duy trì stored procedure trên EC2 instance.',
      D: 'Migrate cơ sở dữ liệu sang Amazon DynamoDB. Cấp phát số lượng lớn read capacity unit (RCU) để hỗ trợ throughput cần thiết, và cấu hình on-demand capacity scaling. Thay stored procedure bằng DynamoDB stream.',
    },
  },
  338: {
    questionVi:
      'Solutions architect phải tạo kế hoạch disaster recovery (DR) cho một nền tảng software as a service (SaaS) khối lượng lớn. Toàn bộ dữ liệu của nền tảng được lưu trong Amazon Aurora MySQL DB cluster. Kế hoạch DR phải sao chép dữ liệu sang một AWS Region phụ. Giải pháp nào đáp ứng các yêu cầu này HIỆU QUẢ NHẤT về chi phí?',
    optionsVi: {
      A: 'Dùng MySQL binary log replication tới Aurora cluster ở Region phụ. Cấp phát một DB instance cho Aurora cluster ở Region phụ.',
      B: 'Thiết lập Aurora global database cho DB cluster. Sau khi thiết lập hoàn tất, gỡ DB instance khỏi Region phụ.',
      C: 'Dùng AWS Database Migration Service (AWS DMS) để liên tục sao chép dữ liệu sang Aurora cluster ở Region phụ. Gỡ DB instance khỏi Region phụ.',
      D: 'Thiết lập Aurora global database cho DB cluster. Chỉ định tối thiểu một DB instance ở Region phụ.',
    },
  },
  339: {
    questionVi:
      'Một công ty có ứng dụng tùy chỉnh với thông tin đăng nhập nhúng sẵn (embedded credentials) truy xuất thông tin từ Amazon RDS MySQL DB instance. Ban quản lý yêu cầu ứng dụng phải được bảo mật hơn với công sức lập trình ÍT NHẤT. Solutions architect nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Dùng AWS Key Management Service (AWS KMS) để tạo key. Cấu hình ứng dụng nạp thông tin đăng nhập cơ sở dữ liệu từ AWS KMS. Bật automatic key rotation.',
      B: 'Tạo thông tin đăng nhập trên cơ sở dữ liệu RDS for MySQL cho user ứng dụng và lưu thông tin đăng nhập trong AWS Secrets Manager. Cấu hình ứng dụng nạp thông tin đăng nhập cơ sở dữ liệu từ Secrets Manager. Tạo AWS Lambda function xoay vòng thông tin đăng nhập trong Secrets Manager.',
      C: 'Tạo thông tin đăng nhập trên cơ sở dữ liệu RDS for MySQL cho user ứng dụng và lưu thông tin đăng nhập trong AWS Secrets Manager. Cấu hình ứng dụng nạp thông tin đăng nhập cơ sở dữ liệu từ Secrets Manager. Thiết lập lịch xoay vòng thông tin đăng nhập cho user ứng dụng trên cơ sở dữ liệu RDS for MySQL bằng Secrets Manager.',
      D: 'Tạo thông tin đăng nhập trên cơ sở dữ liệu RDS for MySQL cho user ứng dụng và lưu thông tin đăng nhập trong AWS Systems Manager Parameter Store. Cấu hình ứng dụng nạp thông tin đăng nhập cơ sở dữ liệu từ Parameter Store. Thiết lập lịch xoay vòng thông tin đăng nhập cho user ứng dụng trên cơ sở dữ liệu RDS for MySQL bằng Parameter Store.',
    },
  },
  340: {
    questionVi:
      'Một công ty truyền thông host website trên AWS. Kiến trúc ứng dụng website gồm một nhóm Amazon EC2 instance phía sau Application Load Balancer (ALB) và cơ sở dữ liệu host trên Amazon Aurora. Đội cybersecurity của công ty báo cáo ứng dụng dễ bị SQL injection. Công ty nên khắc phục vấn đề này như thế nào?',
    optionsVi: {
      A: 'Dùng AWS WAF phía trước ALB. Liên kết web ACL phù hợp với AWS WAF.',
      B: 'Tạo ALB listener rule trả lời SQL injection bằng response cố định.',
      C: 'Đăng ký AWS Shield Advanced để tự động chặn mọi SQL injection.',
      D: 'Thiết lập Amazon Inspector để tự động chặn mọi SQL injection.',
    },
  },
  341: {
    questionVi:
      'Một công ty có Amazon S3 data lake được quản lý bởi AWS Lake Formation. Công ty muốn tạo visualization trong Amazon QuickSight bằng cách join dữ liệu trong data lake với dữ liệu vận hành lưu trong cơ sở dữ liệu Amazon Aurora MySQL. Công ty muốn áp dụng phân quyền cấp cột (column-level authorization) để đội marketing của công ty chỉ truy cập được một tập con cột trong cơ sở dữ liệu. Giải pháp nào đáp ứng các yêu cầu này với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon EMR để nạp dữ liệu trực tiếp từ cơ sở dữ liệu vào QuickSight SPICE engine. Chỉ bao gồm các cột cần thiết.',
      B: 'Dùng AWS Glue Studio để nạp dữ liệu từ cơ sở dữ liệu vào S3 data lake. Gắn IAM policy vào QuickSight user để áp dụng kiểm soát truy cập cấp cột. Dùng Amazon S3 làm data source trong QuickSight.',
      C: 'Dùng AWS Glue Elastic Views để tạo materialized view cho cơ sở dữ liệu trong Amazon S3. Tạo S3 bucket policy để áp dụng kiểm soát truy cập cấp cột cho QuickSight user. Dùng Amazon S3 làm data source trong QuickSight.',
      D: 'Dùng Lake Formation blueprint để nạp dữ liệu từ cơ sở dữ liệu vào S3 data lake. Dùng Lake Formation để áp dụng kiểm soát truy cập cấp cột cho QuickSight user. Dùng Amazon Athena làm data source trong QuickSight.',
    },
  },
  342: {
    questionVi:
      'Một công ty xử lý giao dịch có batch job chạy theo lịch hàng tuần trên Amazon EC2 instance. Các EC2 instance nằm trong Auto Scaling group. Số lượng giao dịch có thể thay đổi, nhưng CPU utilization cơ bản ghi nhận ở mỗi lần chạy tối thiểu là 60%. Công ty cần cấp phát capacity 30 phút trước khi job chạy. Hiện tại, engineer hoàn thành việc này bằng cách chỉnh tham số Auto Scaling group thủ công. Công ty không có nguồn lực để phân tích xu hướng capacity cần thiết cho số lượng Auto Scaling group. Công ty cần cách tự động để chỉnh desired capacity của Auto Scaling group. Giải pháp nào đáp ứng các yêu cầu này với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo dynamic scaling policy cho Auto Scaling group. Cấu hình policy scale theo metric CPU utilization. Đặt target value cho metric là 60%.',
      B: 'Tạo scheduled scaling policy cho Auto Scaling group. Đặt desired capacity, minimum capacity và maximum capacity phù hợp. Đặt recurrence hàng tuần. Đặt start time 30 phút trước khi batch job chạy.',
      C: 'Tạo predictive scaling policy cho Auto Scaling group. Cấu hình policy scale theo forecast. Đặt scaling metric là CPU utilization. Đặt target value cho metric là 60%. Trong policy, đặt instance pre-launch 30 phút trước khi job chạy.',
      D: 'Tạo Amazon EventBridge event gọi AWS Lambda function khi giá trị metric CPU utilization của Auto Scaling group đạt 60%. Cấu hình Lambda function tăng desired capacity và maximum capacity của Auto Scaling group lên 20%.',
    },
  },
  343: {
    questionVi:
      'Solutions architect đang thiết kế kiến trúc disaster recovery (DR) cho một công ty. Công ty có cơ sở dữ liệu MySQL chạy trên Amazon EC2 instance trong private subnet với backup theo lịch. Thiết kế DR cần bao gồm nhiều AWS Region. Giải pháp nào đáp ứng các yêu cầu này với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Migrate cơ sở dữ liệu MySQL sang nhiều EC2 instance. Cấu hình EC2 instance standby ở Region DR. Bật replication.',
      B: 'Migrate cơ sở dữ liệu MySQL sang Amazon RDS. Dùng triển khai Multi-AZ. Bật read replication cho primary DB instance ở các Availability Zone khác nhau.',
      C: 'Migrate cơ sở dữ liệu MySQL sang Amazon Aurora global database. Host primary DB cluster ở Region chính. Host secondary DB cluster ở Region DR.',
      D: 'Lưu backup theo lịch của cơ sở dữ liệu MySQL trong Amazon S3 bucket được cấu hình S3 Cross-Region Replication (CRR). Dùng data backup để khôi phục cơ sở dữ liệu ở Region DR.',
    },
  },
  344: {
    questionVi:
      'Một công ty có ứng dụng Java dùng Amazon Simple Queue Service (Amazon SQS) để parse message. Ứng dụng không thể parse message lớn hơn 256 KB. Công ty muốn triển khai giải pháp cho phép ứng dụng parse message lên tới 50 MB. Giải pháp nào đáp ứng các yêu cầu này với ÍT thay đổi code NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon SQS Extended Client Library for Java để host message lớn hơn 256 KB trong Amazon S3.',
      B: 'Dùng Amazon EventBridge để post message lớn từ ứng dụng thay cho Amazon SQS.',
      C: 'Đổi giới hạn trong Amazon SQS để xử lý message lớn hơn 256 KB.',
      D: 'Lưu message lớn hơn 256 KB trong Amazon Elastic File System (Amazon EFS). Cấu hình Amazon SQS tham chiếu vị trí này trong message.',
    },
  },
  345: {
    questionVi:
      'Một công ty muốn giới hạn quyền truy cập nội dung của một trong các ứng dụng web chính và bảo vệ nội dung bằng kỹ thuật authorization có sẵn trên AWS. Công ty muốn triển khai kiến trúc serverless và giải pháp xác thực cho dưới 100 người dùng. Giải pháp cần tích hợp với ứng dụng web chính và phục vụ nội dung web toàn cầu. Giải pháp cũng phải scale khi lượng người dùng công ty tăng, đồng thời cung cấp độ trễ đăng nhập thấp nhất có thể. Giải pháp nào đáp ứng các yêu cầu này HIỆU QUẢ NHẤT về chi phí?',
    optionsVi: {
      A: 'Dùng Amazon Cognito để xác thực. Dùng Lambda@Edge để authorization. Dùng Amazon CloudFront để phục vụ ứng dụng web toàn cầu.',
      B: 'Dùng AWS Directory Service for Microsoft Active Directory để xác thực. Dùng AWS Lambda để authorization. Dùng Application Load Balancer để phục vụ ứng dụng web toàn cầu.',
      C: 'Dùng Amazon Cognito để xác thực. Dùng AWS Lambda để authorization. Dùng Amazon S3 Transfer Acceleration để phục vụ ứng dụng web toàn cầu.',
      D: 'Dùng AWS Directory Service for Microsoft Active Directory để xác thực. Dùng Lambda@Edge để authorization. Dùng AWS Elastic Beanstalk để phục vụ ứng dụng web toàn cầu.',
    },
  },
  346: {
    questionVi:
      'Một công ty có network-attached storage (NAS) array đã cũ trong data center. NAS array cung cấp SMB share và NFS share cho client workstation. Công ty không muốn mua NAS array mới. Công ty cũng không muốn chịu chi phí gia hạn hợp đồng support của NAS array. Một số dữ liệu được truy cập thường xuyên, nhưng phần lớn dữ liệu không hoạt động. Solutions architect cần triển khai giải pháp migrate dữ liệu sang Amazon S3, dùng S3 Lifecycle policy, và duy trì cùng giao diện (look and feel) cho client workstation. Solutions architect đã xác định AWS Storage Gateway là một phần của giải pháp. Solutions architect nên cấp phát loại storage gateway nào để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Volume Gateway',
      B: 'Tape Gateway',
      C: 'Amazon FSx File Gateway',
      D: 'Amazon S3 File Gateway',
    },
  },
  347: {
    questionVi:
      'Một công ty có ứng dụng chạy trên Amazon EC2 instance. Solutions architect đã chuẩn hóa công ty theo một instance family và nhiều kích thước instance cụ thể dựa trên nhu cầu hiện tại của công ty. Công ty muốn tối đa hóa tiết kiệm chi phí cho ứng dụng trong 3 năm tới. Công ty cần có khả năng đổi instance family và kích thước trong 6 tháng tới dựa trên độ phổ biến và mức sử dụng của ứng dụng. Giải pháp nào đáp ứng các yêu cầu này HIỆU QUẢ NHẤT về chi phí?',
    optionsVi: {
      A: 'Compute Savings Plan',
      B: 'EC2 Instance Savings Plan',
      C: 'Zonal Reserved Instance',
      D: 'Standard Reserved Instance',
    },
  },
  348: {
    questionVi:
      'Một công ty thu thập dữ liệu từ số lượng lớn người tham gia dùng thiết bị đeo (wearable device). Công ty lưu dữ liệu trong bảng Amazon DynamoDB và dùng ứng dụng để phân tích dữ liệu. Workload dữ liệu ổn định và có thể dự đoán được. Công ty muốn giữ chi phí ở mức hoặc dưới ngân sách dự báo cho DynamoDB. Giải pháp nào đáp ứng các yêu cầu này HIỆU QUẢ NHẤT về chi phí?',
    optionsVi: {
      A: 'Dùng provisioned mode và DynamoDB Standard-Infrequent Access (DynamoDB Standard-IA). Đặt reserved capacity cho workload dự báo.',
      B: 'Dùng provisioned mode. Chỉ định read capacity unit (RCU) và write capacity unit (WCU).',
      C: 'Dùng on-demand mode. Đặt read capacity unit (RCU) và write capacity unit (WCU) đủ cao để đáp ứng thay đổi workload.',
      D: 'Dùng on-demand mode. Chỉ định read capacity unit (RCU) và write capacity unit (WCU) với reserved capacity.',
    },
  },
  349: {
    questionVi:
      'Một công ty lưu dữ liệu bảo mật trong Amazon Aurora PostgreSQL database ở Region ap-southeast-3. Cơ sở dữ liệu được mã hóa bằng AWS Key Management Service (AWS KMS) customer managed key. Công ty vừa bị mua lại và phải chia sẻ an toàn một backup của cơ sở dữ liệu với tài khoản AWS của công ty mua lại ở ap-southeast-3. Solutions architect nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo database snapshot. Copy snapshot sang snapshot mới không mã hóa. Chia sẻ snapshot mới với tài khoản AWS của công ty mua lại.',
      B: 'Tạo database snapshot. Thêm tài khoản AWS của công ty mua lại vào KMS key policy. Chia sẻ snapshot với tài khoản AWS của công ty mua lại.',
      C: 'Tạo database snapshot dùng AWS managed KMS key khác. Thêm tài khoản AWS của công ty mua lại vào KMS key alias. Chia sẻ snapshot với tài khoản AWS của công ty mua lại.',
      D: 'Tạo database snapshot. Download database snapshot. Upload database snapshot lên Amazon S3 bucket. Cập nhật S3 bucket policy để cho phép truy cập từ tài khoản AWS của công ty mua lại.',
    },
  },
  350: {
    questionVi:
      'Một công ty dùng Amazon RDS for Microsoft SQL Server Single-AZ DB instance 100 GB ở Region us-east-1 để lưu giao dịch khách hàng. Công ty cần tính sẵn sàng cao và khôi phục tự động cho DB instance. Công ty cũng phải chạy báo cáo trên cơ sở dữ liệu RDS vài lần mỗi năm. Quy trình báo cáo khiến giao dịch mất nhiều thời gian hơn bình thường để ghi vào tài khoản khách hàng. Công ty cần giải pháp cải thiện hiệu năng của quy trình báo cáo. Solutions architect nên kết hợp bước nào để đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Chỉnh DB instance từ Single-AZ DB instance sang triển khai Multi-AZ.',
      B: 'Chụp snapshot của DB instance hiện tại. Khôi phục snapshot sang RDS deployment mới ở Availability Zone khác.',
      C: 'Tạo read replica của DB instance ở Availability Zone khác. Chuyển toàn bộ yêu cầu báo cáo tới read replica.',
      D: 'Migrate cơ sở dữ liệu sang RDS Custom.',
      E: 'Dùng RDS Proxy để giới hạn yêu cầu báo cáo trong maintenance window.',
    },
  },
  351: {
    questionVi:
      'Một công ty đang migrate ứng dụng quản lý dữ liệu của mình lên AWS. Công ty muốn chuyển sang kiến trúc event-driven. Kiến trúc cần phân tán hơn và dùng khái niệm serverless khi thực hiện các phần khác nhau của workflow. Công ty cũng muốn giảm tối thiểu chi phí vận hành. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Xây dựng workflow trong AWS Glue. Dùng AWS Glue gọi AWS Lambda function xử lý các bước workflow.',
      B: 'Xây dựng workflow trong AWS Step Functions. Triển khai ứng dụng trên Amazon EC2 instance. Dùng Step Functions gọi các bước workflow trên EC2 instance.',
      C: 'Xây dựng workflow trong Amazon EventBridge. Dùng EventBridge gọi AWS Lambda function theo lịch để xử lý các bước workflow.',
      D: 'Xây dựng workflow trong AWS Step Functions. Dùng Step Functions để tạo state machine. Dùng state machine gọi AWS Lambda function xử lý các bước workflow.',
    },
  },
  352: {
    questionVi:
      'Một công ty đang thiết kế network cho game trực tuyến nhiều người chơi. Game dùng protocol mạng UDP và sẽ được triển khai ở tám AWS Region. Kiến trúc network cần giảm tối thiểu độ trễ và mất packet để mang lại trải nghiệm chơi game chất lượng cao cho người dùng cuối. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Thiết lập transit gateway ở mỗi Region. Tạo inter-Region peering attachment giữa các transit gateway.',
      B: 'Thiết lập AWS Global Accelerator với UDP listener và endpoint group ở mỗi Region.',
      C: 'Thiết lập Amazon CloudFront với UDP được bật. Cấu hình một origin ở mỗi Region.',
      D: 'Thiết lập VPC peering mesh giữa các Region. Bật UDP cho mỗi VPC.',
    },
  },
  353: {
    questionVi:
      'Một công ty host ứng dụng web ba tầng trên Amazon EC2 instance trong một Availability Zone duy nhất. Ứng dụng web dùng cơ sở dữ liệu MySQL tự quản lý host trên EC2 instance để lưu dữ liệu trong Amazon Elastic Block Store (Amazon EBS) volume. Cơ sở dữ liệu MySQL hiện dùng Provisioned IOPS SSD (io2) EBS volume 1 TB. Công ty dự kiến traffic 1.000 IOPS cho cả read và write ở giờ cao điểm. Công ty muốn giảm tối thiểu gián đoạn, ổn định hiệu năng, và giảm chi phí trong khi vẫn giữ capacity gấp đôi IOPS. Công ty muốn chuyển tầng cơ sở dữ liệu sang giải pháp được quản lý hoàn toàn, có tính sẵn sàng cao và chịu lỗi. Giải pháp nào đáp ứng các yêu cầu này HIỆU QUẢ NHẤT về chi phí?',
    optionsVi: {
      A: 'Dùng triển khai Multi-AZ của Amazon RDS for MySQL DB instance với io2 Block Express EBS volume.',
      B: 'Dùng triển khai Multi-AZ của Amazon RDS for MySQL DB instance với General Purpose SSD (gp2) EBS volume.',
      C: 'Dùng Amazon S3 Intelligent-Tiering access tier.',
      D: 'Dùng hai EC2 instance lớn để host cơ sở dữ liệu ở chế độ active-passive.',
    },
  },
  354: {
    questionVi:
      'Một công ty host ứng dụng serverless trên AWS. Ứng dụng dùng Amazon API Gateway, AWS Lambda, và cơ sở dữ liệu Amazon RDS for PostgreSQL. Công ty nhận thấy lỗi ứng dụng tăng do timeout kết nối cơ sở dữ liệu vào giờ cao điểm hoặc traffic không dự đoán được. Công ty cần giải pháp giảm lỗi ứng dụng với ÍT thay đổi code NHẤT. Solutions architect nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Giảm tốc độ concurrency của Lambda.',
      B: 'Bật RDS Proxy trên RDS DB instance.',
      C: 'Đổi kích thước instance class của RDS DB instance để nhận nhiều kết nối hơn.',
      D: 'Migrate cơ sở dữ liệu sang Amazon DynamoDB với on-demand scaling.',
    },
  },
  355: {
    questionVi:
      'Một công ty đang migrate ứng dụng cũ lên AWS. Ứng dụng chạy batch job mỗi giờ và dùng nhiều CPU. Batch job trung bình mất 15 phút trên server on-premises. Server có 64 virtual CPU (vCPU) và 512 GiB memory. Giải pháp nào chạy batch job trong vòng 15 phút với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Lambda với functional scaling.',
      B: 'Dùng Amazon Elastic Container Service (Amazon ECS) với AWS Fargate.',
      C: 'Dùng Amazon Lightsail với AWS Auto Scaling.',
      D: 'Dùng AWS Batch trên Amazon EC2.',
    },
  },
  356: {
    questionVi:
      'Một công ty lưu object dữ liệu trong Amazon S3 Standard storage. Solutions architect phát hiện 75% dữ liệu ít được truy cập sau 30 ngày. Công ty cần toàn bộ dữ liệu vẫn sẵn sàng truy cập ngay với cùng tính sẵn sàng cao và độ bền, nhưng công ty muốn giảm tối thiểu chi phí lưu trữ. Giải pháp lưu trữ nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Chuyển object dữ liệu sang S3 Glacier Deep Archive sau 30 ngày.',
      B: 'Chuyển object dữ liệu sang S3 Standard-Infrequent Access (S3 Standard-IA) sau 30 ngày.',
      C: 'Chuyển object dữ liệu sang S3 One Zone-Infrequent Access (S3 One Zone-IA) sau 30 ngày.',
      D: 'Chuyển object dữ liệu sang S3 One Zone-Infrequent Access (S3 One Zone-IA) ngay lập tức.',
    },
  },
  357: {
    questionVi:
      'Một công ty game đang chuyển scoreboard công khai của mình từ data center sang AWS Cloud. Công ty dùng Amazon EC2 Windows Server instance phía sau Application Load Balancer để host ứng dụng động. Công ty cần giải pháp lưu trữ có tính sẵn sàng cao cho ứng dụng. Ứng dụng gồm tệp tĩnh và code server-side động. Solutions architect nên kết hợp bước nào để đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Lưu tệp tĩnh trong Amazon S3. Dùng Amazon CloudFront để cache object tại edge.',
      B: 'Lưu tệp tĩnh trong Amazon S3. Dùng Amazon ElastiCache để cache object tại edge.',
      C: 'Lưu code server-side trong Amazon Elastic File System (Amazon EFS). Mount EFS volume vào mỗi EC2 instance để chia sẻ tệp.',
      D: 'Lưu code server-side trong Amazon FSx for Windows File Server. Mount FSx for Windows File Server volume vào mỗi EC2 instance để chia sẻ tệp.',
      E: 'Lưu code server-side trong General Purpose SSD (gp2) Amazon Elastic Block Store (Amazon EBS) volume. Mount EBS volume vào mỗi EC2 instance để chia sẻ tệp.',
    },
  },
  358: {
    questionVi:
      'Một công ty mạng xã hội chạy ứng dụng trên Amazon EC2 instance phía sau Application Load Balancer (ALB). ALB là origin cho một Amazon CloudFront distribution. Ứng dụng có hơn một tỷ ảnh lưu trong Amazon S3 bucket và xử lý hàng nghìn ảnh mỗi giây. Công ty muốn resize ảnh động và phục vụ định dạng phù hợp cho client. Giải pháp nào đáp ứng các yêu cầu này với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Cài thư viện quản lý ảnh bên ngoài trên EC2 instance. Dùng thư viện quản lý ảnh để xử lý ảnh.',
      B: 'Tạo CloudFront origin request policy. Dùng policy để tự động resize ảnh và phục vụ định dạng phù hợp dựa trên header HTTP User-Agent trong request.',
      C: 'Dùng Lambda@Edge function với thư viện quản lý ảnh bên ngoài. Liên kết Lambda@Edge function với CloudFront behavior phục vụ ảnh.',
      D: 'Tạo CloudFront response headers policy. Dùng policy để tự động resize ảnh và phục vụ định dạng phù hợp dựa trên header HTTP User-Agent trong request.',
    },
  },
  359: {
    questionVi:
      'Một bệnh viện cần lưu hồ sơ bệnh nhân trong Amazon S3 bucket. Đội tuân thủ (compliance) của bệnh viện phải đảm bảo toàn bộ thông tin sức khỏe được bảo vệ (PHI) được mã hóa khi truyền (in transit) và khi lưu trữ (at rest). Đội tuân thủ phải quản lý encryption key cho dữ liệu at rest. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo public SSL/TLS certificate trong AWS Certificate Manager (ACM). Liên kết certificate với Amazon S3. Cấu hình default encryption cho mỗi S3 bucket dùng server-side encryption với AWS KMS key (SSE-KMS). Gán đội tuân thủ quản lý KMS key.',
      B: 'Dùng điều kiện aws:SecureTransport trên S3 bucket policy để chỉ cho phép kết nối mã hóa qua HTTPS (TLS). Cấu hình default encryption cho mỗi S3 bucket dùng server-side encryption với S3 managed encryption key (SSE-S3). Gán đội tuân thủ quản lý SSE-S3 key.',
      C: 'Dùng điều kiện aws:SecureTransport trên S3 bucket policy để chỉ cho phép kết nối mã hóa qua HTTPS (TLS). Cấu hình default encryption cho mỗi S3 bucket dùng server-side encryption với AWS KMS key (SSE-KMS). Gán đội tuân thủ quản lý KMS key.',
      D: 'Dùng điều kiện aws:SecureTransport trên S3 bucket policy để chỉ cho phép kết nối mã hóa qua HTTPS (TLS). Dùng Amazon Macie để bảo vệ dữ liệu nhạy cảm lưu trong Amazon S3. Gán đội tuân thủ quản lý Macie.',
    },
  },
  360: {
    questionVi:
      'Một công ty dùng Amazon API Gateway để chạy private gateway với hai REST API trong cùng một VPC. RESTful web service BuyStock gọi RESTful web service CheckFunds để đảm bảo đủ tiền trước khi mua cổ phiếu. Công ty phát hiện trong VPC flow log rằng RESTful web service BuyStock gọi RESTful web service CheckFunds qua internet thay vì qua VPC. Solutions architect phải triển khai giải pháp để các API giao tiếp qua VPC. Giải pháp nào đáp ứng các yêu cầu này với ÍT thay đổi code NHẤT?',
    optionsVi: {
      A: 'Thêm header X-API-Key trong HTTP header để authorization.',
      B: 'Dùng interface endpoint.',
      C: 'Dùng gateway endpoint.',
      D: 'Thêm Amazon Simple Queue Service (Amazon SQS) queue giữa hai REST API.',
    },
  },
  361: {
    questionVi:
      'Một công ty host ứng dụng game nhiều người chơi trên AWS. Công ty muốn ứng dụng đọc dữ liệu với độ trễ dưới một milli giây (sub-millisecond) và chạy truy vấn một lần trên dữ liệu lịch sử. Giải pháp nào đáp ứng các yêu cầu này với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng Amazon RDS cho dữ liệu được truy cập thường xuyên. Chạy script tùy chỉnh định kỳ để export dữ liệu sang Amazon S3 bucket.',
      B: 'Lưu dữ liệu trực tiếp trong Amazon S3 bucket. Triển khai S3 Lifecycle policy chuyển dữ liệu cũ sang S3 Glacier Deep Archive để lưu trữ dài hạn. Chạy truy vấn một lần trên dữ liệu trong Amazon S3 bằng Amazon Athena.',
      C: 'Dùng Amazon DynamoDB với DynamoDB Accelerator (DAX) cho dữ liệu được truy cập thường xuyên. Export dữ liệu sang Amazon S3 bucket bằng DynamoDB table export. Chạy truy vấn một lần trên dữ liệu trong Amazon S3 bằng Amazon Athena.',
      D: 'Dùng Amazon DynamoDB cho dữ liệu được truy cập thường xuyên. Bật streaming sang Amazon Kinesis Data Streams. Dùng Amazon Kinesis Data Firehose để đọc dữ liệu từ Kinesis Data Streams. Lưu record trong Amazon S3 bucket.',
    },
  },
  362: {
    questionVi:
      'Một công ty dùng hệ thống xử lý thanh toán yêu cầu message cho một payment ID cụ thể phải được nhận theo đúng thứ tự đã gửi. Nếu không, các giao dịch thanh toán có thể bị xử lý sai. Solutions architect nên thực hiện hành động nào để đáp ứng yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Ghi message vào bảng Amazon DynamoDB với payment ID làm partition key.',
      B: 'Ghi message vào Amazon Kinesis data stream với payment ID làm partition key.',
      C: 'Ghi message vào Amazon ElastiCache for Memcached cluster với payment ID làm key.',
      D: 'Ghi message vào Amazon Simple Queue Service (Amazon SQS) queue. Đặt message attribute dùng payment ID.',
      E: 'Ghi message vào Amazon Simple Queue Service (Amazon SQS) FIFO queue. Đặt message group dùng payment ID.',
    },
  },
  363: {
    questionVi:
      'Một công ty đang xây dựng hệ thống game cần gửi event riêng biệt tới dịch vụ leaderboard, matchmaking, và authentication đồng thời. Công ty cần hệ thống event-driven trên AWS đảm bảo thứ tự của event. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Amazon EventBridge event bus',
      B: 'Amazon Simple Notification Service (Amazon SNS) FIFO topic',
      C: 'Amazon Simple Notification Service (Amazon SNS) standard topic',
      D: 'Amazon Simple Queue Service (Amazon SQS) FIFO queue',
    },
  },
  364: {
    questionVi:
      'Một bệnh viện đang thiết kế ứng dụng mới thu thập triệu chứng từ bệnh nhân. Bệnh viện đã quyết định dùng Amazon Simple Queue Service (Amazon SQS) và Amazon Simple Notification Service (Amazon SNS) trong kiến trúc. Solutions architect đang xem xét thiết kế hạ tầng. Dữ liệu phải được mã hóa khi lưu trữ (at rest) và khi truyền (in transit). Chỉ nhân sự được ủy quyền của bệnh viện mới được truy cập dữ liệu. Solutions architect nên kết hợp bước nào để đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Bật server-side encryption trên thành phần SQS. Cập nhật default key policy để giới hạn dùng key cho một tập principal được ủy quyền.',
      B: 'Bật server-side encryption trên thành phần SNS bằng AWS Key Management Service (AWS KMS) customer managed key. Áp dụng key policy để giới hạn dùng key cho một tập principal được ủy quyền.',
      C: 'Bật encryption trên thành phần SNS. Cập nhật default key policy để giới hạn dùng key cho một tập principal được ủy quyền. Đặt điều kiện trong topic policy chỉ cho phép kết nối mã hóa qua TLS.',
      D: 'Bật server-side encryption trên thành phần SQS bằng AWS Key Management Service (AWS KMS) customer managed key. Áp dụng key policy để giới hạn dùng key cho một tập principal được ủy quyền. Đặt điều kiện trong queue policy chỉ cho phép kết nối mã hóa qua TLS.',
      E: 'Bật server-side encryption trên thành phần SQS bằng AWS Key Management Service (AWS KMS) customer managed key. Áp dụng IAM policy để giới hạn dùng key cho một tập principal được ủy quyền. Đặt điều kiện trong queue policy chỉ cho phép kết nối mã hóa qua TLS.',
    },
  },
  365: {
    questionVi:
      'Một công ty chạy ứng dụng web được hỗ trợ bởi Amazon RDS. Một database administrator mới đã gây mất dữ liệu do vô tình chỉnh sửa thông tin trong bảng cơ sở dữ liệu. Để giúp khôi phục sau sự cố dạng này, công ty muốn có khả năng khôi phục cơ sở dữ liệu về trạng thái 5 phút trước bất kỳ thay đổi nào trong 30 ngày qua. Solutions architect nên đưa tính năng nào vào thiết kế để đáp ứng yêu cầu này?',
    optionsVi: {
      A: 'Read replica',
      B: 'Manual snapshot',
      C: 'Automated backup',
      D: 'Triển khai Multi-AZ',
    },
  },
  366: {
    questionVi:
      'Ứng dụng web của một công ty gồm Amazon API Gateway API phía trước AWS Lambda function và cơ sở dữ liệu Amazon DynamoDB. Lambda function xử lý business logic, và bảng DynamoDB lưu trữ dữ liệu. Ứng dụng dùng Amazon Cognito user pool để nhận diện từng người dùng ứng dụng. Solutions architect cần cập nhật ứng dụng để chỉ người dùng có subscription mới có thể truy cập nội dung premium. Giải pháp nào đáp ứng yêu cầu này với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Bật API caching và throttling trên API Gateway API.',
      B: 'Thiết lập AWS WAF trên API Gateway API. Tạo rule lọc người dùng có subscription.',
      C: 'Áp dụng quyền IAM chi tiết (fine-grained) cho nội dung premium trong bảng DynamoDB.',
      D: 'Triển khai API usage plan và API key để giới hạn quyền truy cập của người dùng không có subscription.',
    },
  },
  367: {
    questionVi:
      'Một công ty dùng Amazon Route 53 latency-based routing để định tuyến yêu cầu tới ứng dụng dựa trên UDP cho người dùng trên toàn thế giới. Ứng dụng được host trên các server dự phòng trong data center on-premises của công ty ở Hoa Kỳ, Châu Á, và Châu Âu. Yêu cầu tuân thủ của công ty quy định ứng dụng phải được host on-premises. Công ty muốn cải thiện hiệu năng và tính sẵn sàng của ứng dụng. Solutions architect nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cấu hình ba Network Load Balancer (NLB) ở ba AWS Region để xử lý endpoint on-premises. Tạo accelerator bằng AWS Global Accelerator, và đăng ký các NLB làm endpoint của accelerator. Cung cấp quyền truy cập ứng dụng bằng CNAME trỏ tới DNS của accelerator.',
      B: 'Cấu hình ba Application Load Balancer (ALB) ở ba AWS Region để xử lý endpoint on-premises. Tạo accelerator bằng AWS Global Accelerator, và đăng ký các ALB làm endpoint của accelerator. Cung cấp quyền truy cập ứng dụng bằng CNAME trỏ tới DNS của accelerator.',
      C: 'Cấu hình ba Network Load Balancer (NLB) ở ba AWS Region để xử lý endpoint on-premises. Trong Route 53, tạo bản ghi latency-based trỏ tới ba NLB, và dùng làm origin cho một Amazon CloudFront distribution. Cung cấp quyền truy cập ứng dụng bằng CNAME trỏ tới DNS của CloudFront.',
      D: 'Cấu hình ba Application Load Balancer (ALB) ở ba AWS Region để xử lý endpoint on-premises. Trong Route 53, tạo bản ghi latency-based trỏ tới ba ALB, và dùng làm origin cho một Amazon CloudFront distribution. Cung cấp quyền truy cập ứng dụng bằng CNAME trỏ tới DNS của CloudFront.',
    },
  },
  368: {
    questionVi:
      'Solutions architect muốn mọi người dùng mới có yêu cầu độ phức tạp cụ thể và chu kỳ xoay vòng bắt buộc cho password IAM user. Solutions architect nên làm gì để thực hiện điều này?',
    optionsVi: {
      A: 'Đặt password policy tổng thể cho toàn bộ tài khoản AWS.',
      B: 'Đặt password policy cho từng IAM user trong tài khoản AWS.',
      C: 'Dùng phần mềm bên thứ ba để đặt yêu cầu password.',
      D: 'Gắn Amazon CloudWatch rule vào event Create_newuser để đặt password với yêu cầu phù hợp.',
    },
  },
  369: {
    questionVi:
      'Một công ty đã migrate ứng dụng lên Amazon EC2 Linux instance. Một trong các EC2 instance chạy nhiều task 1 giờ theo lịch. Các task này được viết bởi nhiều đội khác nhau và không có ngôn ngữ lập trình chung. Công ty lo ngại về hiệu năng và khả năng mở rộng khi các task này chạy trên một instance duy nhất. Solutions architect cần triển khai giải pháp giải quyết những lo ngại này. Giải pháp nào đáp ứng các yêu cầu này với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Batch để chạy task dạng job. Lên lịch job bằng Amazon EventBridge (Amazon CloudWatch Events).',
      B: 'Chuyển EC2 instance sang container. Dùng AWS App Runner để tạo container theo yêu cầu chạy task dạng job.',
      C: 'Copy task sang AWS Lambda function. Lên lịch Lambda function bằng Amazon EventBridge (Amazon CloudWatch Events).',
      D: 'Tạo Amazon Machine Image (AMI) từ EC2 instance chạy task. Tạo Auto Scaling group với AMI để chạy nhiều bản sao của instance.',
    },
  },
  370: {
    questionVi:
      'Một công ty chạy ứng dụng web ba tầng công khai trong một VPC. Ứng dụng chạy trên Amazon EC2 instance trên nhiều Availability Zone. Các EC2 instance chạy trong private subnet cần giao tiếp với license server qua internet. Công ty cần giải pháp được quản lý giảm tối thiểu công sức vận hành. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cấp phát NAT instance trong public subnet. Chỉnh route table của mỗi private subnet với route mặc định trỏ tới NAT instance.',
      B: 'Cấp phát NAT instance trong private subnet. Chỉnh route table của mỗi private subnet với route mặc định trỏ tới NAT instance.',
      C: 'Cấp phát NAT gateway trong public subnet. Chỉnh route table của mỗi private subnet với route mặc định trỏ tới NAT gateway.',
      D: 'Cấp phát NAT gateway trong private subnet. Chỉnh route table của mỗi private subnet với route mặc định trỏ tới NAT gateway.',
    },
  },
  371: {
    questionVi:
      'Một công ty cần tạo Amazon Elastic Kubernetes Service (Amazon EKS) cluster để host ứng dụng streaming media số. EKS cluster sẽ dùng managed node group được hỗ trợ bởi Amazon Elastic Block Store (Amazon EBS) volume để lưu trữ. Công ty phải mã hóa toàn bộ dữ liệu at rest bằng customer managed key lưu trong AWS Key Management Service (AWS KMS). Kết hợp hành động nào đáp ứng yêu cầu này với chi phí vận hành THẤP NHẤT? (Chọn hai.)',
    optionsVi: {
      A: 'Dùng Kubernetes plugin sử dụng customer managed key để thực hiện mã hóa dữ liệu.',
      B: 'Sau khi tạo EKS cluster, xác định EBS volume. Bật encryption bằng customer managed key.',
      C: 'Bật EBS encryption theo mặc định ở AWS Region nơi EKS cluster sẽ được tạo. Chọn customer managed key làm key mặc định.',
      D: 'Tạo EKS cluster. Tạo IAM role có policy cấp quyền sử dụng customer managed key. Liên kết role với EKS cluster.',
      E: 'Lưu customer managed key dưới dạng Kubernetes secret trong EKS cluster. Dùng customer managed key để mã hóa EBS volume.',
    },
  },
  372: {
    questionVi:
      'Một công ty muốn migrate cơ sở dữ liệu Oracle lên AWS. Cơ sở dữ liệu gồm một bảng duy nhất chứa hàng triệu ảnh geographic information systems (GIS) độ phân giải cao được nhận diện bằng geographic code. Khi thảm họa tự nhiên xảy ra, hàng chục nghìn ảnh được cập nhật mỗi vài phút. Mỗi geographic code có một ảnh hoặc dòng duy nhất liên kết với nó. Công ty muốn giải pháp có tính sẵn sàng cao và có thể mở rộng trong các sự kiện như vậy. Giải pháp nào đáp ứng các yêu cầu này HIỆU QUẢ NHẤT về chi phí?',
    optionsVi: {
      A: 'Lưu ảnh và geographic code trong một bảng cơ sở dữ liệu. Dùng Oracle chạy trên Amazon RDS Multi-AZ DB instance.',
      B: 'Lưu ảnh trong Amazon S3 bucket. Dùng Amazon DynamoDB với geographic code làm key và S3 URL của ảnh làm value.',
      C: 'Lưu ảnh và geographic code trong bảng Amazon DynamoDB. Cấu hình DynamoDB Accelerator (DAX) trong thời gian tải cao.',
      D: 'Lưu ảnh trong Amazon S3 bucket. Lưu geographic code và S3 URL của ảnh trong một bảng cơ sở dữ liệu. Dùng Oracle chạy trên Amazon RDS Multi-AZ DB instance.',
    },
  },
  373: {
    questionVi:
      'Một công ty có ứng dụng thu thập dữ liệu từ sensor IoT trên xe ô tô. Dữ liệu được stream và lưu trong Amazon S3 qua Amazon Kinesis Data Firehose. Dữ liệu tạo ra hàng nghìn tỷ S3 object mỗi năm. Mỗi sáng, công ty dùng dữ liệu của 30 ngày trước để retrain một nhóm mô hình machine learning (ML). Bốn lần mỗi năm, công ty dùng dữ liệu của 12 tháng trước để phân tích và train các mô hình ML khác. Dữ liệu phải sẵn sàng với độ trễ tối thiểu trong tối đa 1 năm. Sau 1 năm, dữ liệu phải được giữ lại phục vụ lưu trữ archive. Giải pháp lưu trữ nào đáp ứng các yêu cầu này HIỆU QUẢ NHẤT về chi phí?',
    optionsVi: {
      A: 'Dùng storage class S3 Intelligent-Tiering. Tạo S3 Lifecycle policy chuyển object sang S3 Glacier Deep Archive sau 1 năm.',
      B: 'Dùng storage class S3 Intelligent-Tiering. Cấu hình S3 Intelligent-Tiering tự động chuyển object sang S3 Glacier Deep Archive sau 1 năm.',
      C: 'Dùng storage class S3 Standard-Infrequent Access (S3 Standard-IA). Tạo S3 Lifecycle policy chuyển object sang S3 Glacier Deep Archive sau 1 năm.',
      D: 'Dùng storage class S3 Standard. Tạo S3 Lifecycle policy chuyển object sang S3 Standard-Infrequent Access (S3 Standard-IA) sau 30 ngày, rồi sang S3 Glacier Deep Archive sau 1 năm.',
    },
  },
  374: {
    questionVi:
      'Một công ty đang chạy nhiều ứng dụng doanh nghiệp riêng biệt trong ba VPC ở Region us-east-1. Các ứng dụng phải có thể giao tiếp giữa các VPC. Các ứng dụng cũng phải có thể liên tục gửi hàng trăm gigabyte dữ liệu mỗi ngày tới một ứng dụng nhạy cảm với độ trễ chạy trong một data center on-premises duy nhất. Solutions architect cần thiết kế giải pháp kết nối network tối đa hóa hiệu quả chi phí. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cấu hình ba kết nối AWS Site-to-Site VPN từ data center tới AWS. Thiết lập kết nối bằng cách cấu hình một kết nối VPN cho mỗi VPC.',
      B: 'Khởi chạy virtual network appliance bên thứ ba trong mỗi VPC. Thiết lập IPsec VPN tunnel giữa data center và mỗi virtual appliance.',
      C: 'Thiết lập ba kết nối AWS Direct Connect từ data center tới Direct Connect gateway ở us-east-1. Thiết lập kết nối bằng cách cấu hình mỗi VPC dùng một trong các kết nối Direct Connect.',
      D: 'Thiết lập một kết nối AWS Direct Connect từ data center tới AWS. Tạo transit gateway, và đính mỗi VPC vào transit gateway. Thiết lập kết nối giữa kết nối Direct Connect và transit gateway.',
    },
  },
  375: {
    questionVi:
      'Một công ty ecommerce đang xây dựng ứng dụng phân tán gồm nhiều hàm serverless và dịch vụ AWS để hoàn thành các task xử lý đơn hàng. Các task này cần phê duyệt thủ công như một phần của workflow. Solutions architect cần thiết kế kiến trúc cho ứng dụng xử lý đơn hàng. Giải pháp phải có khả năng kết hợp nhiều AWS Lambda function thành ứng dụng serverless phản hồi nhanh. Giải pháp cũng phải orchestrate dữ liệu và dịch vụ chạy trên Amazon EC2 instance, container, hoặc server on-premises. Giải pháp nào đáp ứng các yêu cầu này với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Step Functions để xây dựng ứng dụng.',
      B: 'Tích hợp toàn bộ thành phần ứng dụng trong một AWS Glue job.',
      C: 'Dùng Amazon Simple Queue Service (Amazon SQS) để xây dựng ứng dụng.',
      D: 'Dùng AWS Lambda function và event Amazon EventBridge để xây dựng ứng dụng.',
    },
  },
  376: {
    questionVi:
      'Một công ty đã khởi chạy Amazon RDS for MySQL DB instance. Hầu hết kết nối tới cơ sở dữ liệu đến từ ứng dụng serverless. Traffic ứng dụng tới cơ sở dữ liệu thay đổi đáng kể ở các khoảng thời gian ngẫu nhiên. Vào thời điểm nhu cầu cao, người dùng báo lỗi ứng dụng gặp lỗi từ chối kết nối cơ sở dữ liệu. Giải pháp nào giải quyết vấn đề này với chi phí vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo proxy trong RDS Proxy. Cấu hình ứng dụng của người dùng dùng DB instance qua RDS Proxy.',
      B: 'Triển khai Amazon ElastiCache for Memcached giữa ứng dụng của người dùng và DB instance.',
      C: 'Migrate DB instance sang instance class khác có I/O capacity cao hơn. Cấu hình ứng dụng của người dùng dùng DB instance mới.',
      D: 'Cấu hình Multi-AZ cho DB instance. Cấu hình ứng dụng của người dùng chuyển đổi giữa các DB instance.',
    },
  },
  377: {
    questionVi:
      'Một công ty gần đây đã triển khai hệ thống kiểm toán mới để tập trung thông tin về phiên bản hệ điều hành, vá lỗi, và phần mềm đã cài trên Amazon EC2 instance. Solutions architect phải đảm bảo mọi instance được cấp phát qua EC2 Auto Scaling group gửi báo cáo thành công tới hệ thống kiểm toán ngay khi được khởi chạy và khi bị chấm dứt. Giải pháp nào đạt được mục tiêu này HIỆU QUẢ NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Lambda function theo lịch và chạy script từ xa trên mọi EC2 instance để gửi dữ liệu tới hệ thống kiểm toán.',
      B: 'Dùng EC2 Auto Scaling lifecycle hook để chạy script tùy chỉnh gửi dữ liệu tới hệ thống kiểm toán khi instance được khởi chạy và chấm dứt.',
      C: 'Dùng EC2 Auto Scaling launch configuration để chạy script tùy chỉnh qua user data gửi dữ liệu tới hệ thống kiểm toán khi instance được khởi chạy và chấm dứt.',
      D: 'Chạy script tùy chỉnh trên hệ điều hành của instance để gửi dữ liệu tới hệ thống kiểm toán. Cấu hình script được gọi bởi EC2 Auto Scaling group khi instance khởi động và bị chấm dứt.',
    },
  },
  378: {
    questionVi:
      'Một công ty đang phát triển game nhiều người chơi thời gian thực dùng UDP để giao tiếp giữa client và server trong Auto Scaling group. Nhu cầu tăng đột biến được dự đoán trong ngày, vì vậy nền tảng game server phải thích ứng theo. Developer muốn lưu điểm số người chơi và dữ liệu phi quan hệ khác trong giải pháp cơ sở dữ liệu tự scale không cần can thiệp. Solutions architect nên đề xuất giải pháp nào?',
    optionsVi: {
      A: 'Dùng Amazon Route 53 để phân phối traffic và Amazon Aurora Serverless để lưu trữ dữ liệu.',
      B: 'Dùng Network Load Balancer để phân phối traffic và Amazon DynamoDB on-demand để lưu trữ dữ liệu.',
      C: 'Dùng Network Load Balancer để phân phối traffic và Amazon Aurora Global Database để lưu trữ dữ liệu.',
      D: 'Dùng Application Load Balancer để phân phối traffic và Amazon DynamoDB global table để lưu trữ dữ liệu.',
    },
  },
  379: {
    questionVi:
      'Một công ty host ứng dụng frontend dùng backend Amazon API Gateway API tích hợp với AWS Lambda. Khi API nhận yêu cầu, Lambda function nạp nhiều thư viện. Sau đó, Lambda function kết nối tới cơ sở dữ liệu Amazon RDS, xử lý dữ liệu, và trả dữ liệu về ứng dụng frontend. Công ty muốn đảm bảo độ trễ phản hồi thấp nhất có thể cho toàn bộ người dùng với ÍT thay đổi vận hành công ty NHẤT. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Thiết lập kết nối giữa ứng dụng frontend và cơ sở dữ liệu để truy vấn nhanh hơn bằng cách bỏ qua API.',
      B: 'Cấu hình provisioned concurrency cho Lambda function xử lý yêu cầu.',
      C: 'Cache kết quả truy vấn trong Amazon S3 để truy xuất nhanh hơn cho tập dữ liệu tương tự.',
      D: 'Tăng kích thước cơ sở dữ liệu để tăng số kết nối Lambda có thể thiết lập cùng lúc.',
    },
  },
  380: {
    questionVi:
      'Một công ty đang migrate workload on-premises lên AWS Cloud. Công ty đã dùng một số Amazon EC2 instance và Amazon RDS DB instance. Công ty muốn giải pháp tự động khởi động và dừng EC2 instance và DB instance ngoài giờ làm việc. Giải pháp phải giảm tối thiểu chi phí và công sức bảo trì hạ tầng. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Scale EC2 instance bằng elastic resize. Scale DB instance về zero ngoài giờ làm việc.',
      B: 'Tìm giải pháp partner trên AWS Marketplace tự động khởi động và dừng EC2 instance và DB instance theo lịch.',
      C: 'Khởi chạy thêm một EC2 instance. Cấu hình lịch crontab chạy shell script khởi động và dừng EC2 instance và DB instance hiện có theo lịch.',
      D: 'Tạo AWS Lambda function khởi động và dừng EC2 instance và DB instance. Cấu hình Amazon EventBridge gọi Lambda function theo lịch.',
    },
  },
  381: {
    questionVi:
      'Một công ty host ứng dụng web ba tầng gồm cơ sở dữ liệu PostgreSQL. Cơ sở dữ liệu lưu metadata từ tài liệu. Công ty tìm kiếm metadata theo từ khóa để lấy tài liệu mà công ty xem xét trong báo cáo hàng tháng. Tài liệu được lưu trong Amazon S3. Tài liệu thường chỉ được viết một lần, nhưng được cập nhật thường xuyên. Quy trình báo cáo mất vài giờ khi dùng truy vấn quan hệ. Quy trình báo cáo không được ngăn cản việc chỉnh sửa tài liệu hoặc thêm tài liệu mới. Solutions architect cần triển khai giải pháp để đẩy nhanh quy trình báo cáo. Giải pháp nào đáp ứng các yêu cầu này với LƯỢNG THAY ĐỔI ÍT NHẤT tới code ứng dụng?',
    optionsVi: {
      A: 'Thiết lập Amazon DocumentDB (with MongoDB compatibility) cluster mới gồm read replica. Scale read replica để tạo báo cáo.',
      B: 'Thiết lập Amazon Aurora PostgreSQL DB cluster mới gồm Aurora Replica. Gửi truy vấn tới Aurora Replica để tạo báo cáo.',
      C: 'Thiết lập Amazon RDS for PostgreSQL Multi-AZ DB instance mới. Cấu hình module báo cáo truy vấn secondary RDS node để module báo cáo không ảnh hưởng primary node.',
      D: 'Thiết lập bảng Amazon DynamoDB mới để lưu tài liệu. Dùng write capacity cố định để hỗ trợ mục tài liệu mới. Tự động scale read capacity để hỗ trợ báo cáo.',
    },
  },
  382: {
    questionVi:
      'Một công ty có ứng dụng ba tầng trên AWS thu thập dữ liệu sensor từ thiết bị người dùng. Traffic đi qua Network Load Balancer (NLB), sau đó tới Amazon EC2 instance cho tầng web, và cuối cùng tới EC2 instance cho tầng ứng dụng. Tầng ứng dụng gọi tới cơ sở dữ liệu. Solutions architect nên làm gì để cải thiện bảo mật của dữ liệu khi truyền (in transit)?',
    optionsVi: {
      A: 'Cấu hình TLS listener. Triển khai server certificate trên NLB.',
      B: 'Cấu hình AWS Shield Advanced. Bật AWS WAF trên NLB.',
      C: 'Đổi load balancer sang Application Load Balancer (ALB). Bật AWS WAF trên ALB.',
      D: 'Mã hóa Amazon Elastic Block Store (Amazon EBS) volume trên EC2 instance bằng AWS Key Management Service (AWS KMS).',
    },
  },
  383: {
    questionVi:
      'Một công ty đang lên kế hoạch migrate ứng dụng commercial off-the-shelf từ data center on-premises lên AWS. Phần mềm có mô hình license theo socket và core với yêu cầu capacity và uptime có thể dự đoán được. Công ty muốn dùng license hiện có, được mua đầu năm nay. Tùy chọn giá Amazon EC2 nào HIỆU QUẢ NHẤT về chi phí?',
    optionsVi: {
      A: 'Dedicated Reserved Host',
      B: 'Dedicated On-Demand Host',
      C: 'Dedicated Reserved Instance',
      D: 'Dedicated On-Demand Instance',
    },
  },
  384: {
    questionVi:
      'Một công ty chạy ứng dụng trên Amazon EC2 Linux instance trên nhiều Availability Zone. Ứng dụng cần tầng lưu trữ có tính sẵn sàng cao và tuân thủ Portable Operating System Interface (POSIX). Tầng lưu trữ phải cung cấp độ bền dữ liệu tối đa và có thể chia sẻ giữa các EC2 instance. Dữ liệu trong tầng lưu trữ sẽ được truy cập thường xuyên trong 30 ngày đầu và ít truy cập sau đó. Giải pháp nào đáp ứng các yêu cầu này HIỆU QUẢ NHẤT về chi phí?',
    optionsVi: {
      A: 'Dùng storage class Amazon S3 Standard. Tạo S3 Lifecycle policy chuyển dữ liệu ít truy cập sang S3 Glacier.',
      B: 'Dùng storage class Amazon S3 Standard. Tạo S3 Lifecycle policy chuyển dữ liệu ít truy cập sang S3 Standard-Infrequent Access (S3 Standard-IA).',
      C: 'Dùng storage class Amazon Elastic File System (Amazon EFS) Standard. Tạo lifecycle management policy chuyển dữ liệu ít truy cập sang EFS Standard-Infrequent Access (EFS Standard-IA).',
      D: 'Dùng storage class Amazon Elastic File System (Amazon EFS) One Zone. Tạo lifecycle management policy chuyển dữ liệu ít truy cập sang EFS One Zone-Infrequent Access (EFS One Zone-IA).',
    },
  },
  385: {
    questionVi:
      'Solutions architect đang tạo thiết kế VPC mới. Có hai public subnet cho load balancer, hai private subnet cho web server, và hai private subnet cho MySQL. Web server chỉ dùng HTTPS. Solutions architect đã tạo security group cho load balancer cho phép port 443 từ 0.0.0.0/0. Chính sách công ty yêu cầu mỗi resource chỉ có quyền truy cập tối thiểu cần thiết để vẫn thực hiện được task. Solutions architect nên dùng chiến lược cấu hình bổ sung nào để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo security group cho web server và cho phép port 443 từ 0.0.0.0/0. Tạo security group cho MySQL server và cho phép port 3306 từ security group của web server.',
      B: 'Tạo network ACL cho web server và cho phép port 443 từ 0.0.0.0/0. Tạo network ACL cho MySQL server và cho phép port 3306 từ security group của web server.',
      C: 'Tạo security group cho web server và cho phép port 443 từ load balancer. Tạo security group cho MySQL server và cho phép port 3306 từ security group của web server.',
      D: 'Tạo network ACL cho web server và cho phép port 443 từ load balancer. Tạo network ACL cho MySQL server và cho phép port 3306 từ security group của web server.',
    },
  },
  386: {
    questionVi:
      'Một công ty ecommerce đang chạy ứng dụng multi-tier trên AWS. Cả tầng frontend và backend đều chạy trên Amazon EC2, và cơ sở dữ liệu chạy trên Amazon RDS for MySQL. Tầng backend giao tiếp với RDS instance. Có nhiều lời gọi thường xuyên trả về tập dữ liệu giống nhau từ cơ sở dữ liệu gây chậm hiệu năng. Hành động nào nên được thực hiện để cải thiện hiệu năng của tầng backend?',
    optionsVi: {
      A: 'Triển khai Amazon SNS để lưu lời gọi cơ sở dữ liệu.',
      B: 'Triển khai Amazon ElastiCache để cache tập dữ liệu lớn.',
      C: 'Triển khai RDS for MySQL read replica để cache lời gọi cơ sở dữ liệu.',
      D: 'Triển khai Amazon Kinesis Data Firehose để stream lời gọi tới cơ sở dữ liệu.',
    },
  },
};

export default T;
