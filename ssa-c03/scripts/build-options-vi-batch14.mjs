#!/usr/bin/env node
import { writeBatch } from './build-options-vi-batches.mjs';

const T = {
  362: {
    questionVi:
      'Một công ty dùng hệ thống xử lý thanh toán yêu cầu message cho một payment ID cụ thể phải được nhận đúng theo thứ tự đã gửi. Nếu không, các giao dịch thanh toán có thể bị xử lý sai. Kiến trúc sư giải pháp nên thực hiện hành động nào để đáp ứng yêu cầu này? (Chọn hai.)',
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
      'Một công ty đang xây dựng hệ thống game cần gửi các event riêng biệt tới dịch vụ leaderboard, matchmaking và authentication đồng thời. Công ty cần một hệ thống event-driven trên AWS đảm bảo thứ tự của các event. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Amazon EventBridge event bus',
      B: 'Amazon Simple Notification Service (Amazon SNS) FIFO topics',
      C: 'Amazon Simple Notification Service (Amazon SNS) standard topics',
      D: 'Amazon Simple Queue Service (Amazon SQS) FIFO queues',
    },
  },
  364: {
    questionVi:
      'Một bệnh viện đang thiết kế ứng dụng mới thu thập triệu chứng từ bệnh nhân. Bệnh viện đã quyết định dùng Amazon Simple Queue Service (Amazon SQS) và Amazon Simple Notification Service (Amazon SNS) trong kiến trúc. Kiến trúc sư giải pháp đang review thiết kế hạ tầng. Dữ liệu phải được mã hóa khi lưu trữ (at rest) và khi truyền (in transit). Chỉ nhân viên được ủy quyền của bệnh viện mới được truy cập dữ liệu. Kết hợp bước nào kiến trúc sư giải pháp nên thực hiện để đáp ứng các yêu cầu này? (Chọn hai.)',
    optionsVi: {
      A: 'Bật server-side encryption trên các thành phần SQS. Cập nhật default key policy để giới hạn sử dụng key cho một nhóm principal được ủy quyền.',
      B: 'Bật server-side encryption trên các thành phần SNS bằng AWS Key Management Service (AWS KMS) customer managed key. Áp dụng key policy để giới hạn sử dụng key cho một nhóm principal được ủy quyền.',
      C: 'Bật mã hóa trên các thành phần SNS. Cập nhật default key policy để giới hạn sử dụng key cho một nhóm principal được ủy quyền. Đặt điều kiện trong topic policy chỉ cho phép kết nối mã hóa qua TLS.',
      D: 'Bật server-side encryption trên các thành phần SQS bằng AWS Key Management Service (AWS KMS) customer managed key. Áp dụng key policy để giới hạn sử dụng key cho một nhóm principal được ủy quyền. Đặt điều kiện trong queue policy chỉ cho phép kết nối mã hóa qua TLS.',
      E: 'Bật server-side encryption trên các thành phần SQS bằng AWS Key Management Service (AWS KMS) customer managed key. Áp dụng IAM policy để giới hạn sử dụng key cho một nhóm principal được ủy quyền. Đặt điều kiện trong queue policy chỉ cho phép kết nối mã hóa qua TLS.',
    },
  },
  365: {
    questionVi:
      'Một công ty chạy ứng dụng web được hỗ trợ bởi Amazon RDS. Một database administrator mới đã gây mất dữ liệu do vô tình sửa thông tin trong bảng database. Để giúp khôi phục sau sự cố dạng này, công ty muốn có khả năng khôi phục database về trạng thái 5 phút trước bất kỳ thay đổi nào trong vòng 30 ngày qua. Kiến trúc sư giải pháp nên đưa tính năng nào vào thiết kế để đáp ứng yêu cầu này?',
    optionsVi: {
      A: 'Read replicas',
      B: 'Manual snapshots',
      C: 'Automated backups',
      D: 'Multi-AZ deployments',
    },
  },
  366: {
    questionVi:
      'Ứng dụng web của một công ty gồm Amazon API Gateway API đặt trước AWS Lambda function và Amazon DynamoDB database. Lambda function xử lý business logic, và bảng DynamoDB lưu dữ liệu. Ứng dụng dùng Amazon Cognito user pools để xác định từng người dùng ứng dụng. Kiến trúc sư giải pháp cần cập nhật ứng dụng để chỉ người dùng có subscription mới truy cập được nội dung premium. Giải pháp nào đáp ứng yêu cầu này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Bật API caching và throttling trên API Gateway API.',
      B: 'Thiết lập AWS WAF trên API Gateway API. Tạo rule lọc người dùng có subscription.',
      C: 'Áp dụng quyền IAM chi tiết cho nội dung premium trong bảng DynamoDB.',
      D: 'Triển khai API usage plans và API keys để giới hạn quyền truy cập của người dùng không có subscription.',
    },
  },
  367: {
    questionVi:
      'Một công ty dùng Amazon Route 53 latency-based routing để định tuyến request tới ứng dụng dựa trên UDP cho người dùng trên toàn thế giới. Ứng dụng được host trên các server dự phòng trong data center on-premises của công ty tại Hoa Kỳ, châu Á và châu Âu. Yêu cầu tuân thủ của công ty quy định ứng dụng phải được host on-premises. Công ty muốn cải thiện hiệu năng và tính sẵn sàng của ứng dụng. Kiến trúc sư giải pháp nên làm gì để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cấu hình ba Network Load Balancers (NLBs) ở ba AWS Regions để hướng tới các endpoint on-premises. Tạo accelerator bằng AWS Global Accelerator, và đăng ký các NLBs làm endpoint của nó. Cung cấp quyền truy cập ứng dụng bằng CNAME trỏ tới DNS của accelerator.',
      B: 'Cấu hình ba Application Load Balancers (ALBs) ở ba AWS Regions để hướng tới các endpoint on-premises. Tạo accelerator bằng AWS Global Accelerator, và đăng ký các ALBs làm endpoint của nó. Cung cấp quyền truy cập ứng dụng bằng CNAME trỏ tới DNS của accelerator.',
      C: 'Cấu hình ba Network Load Balancers (NLBs) ở ba AWS Regions để hướng tới các endpoint on-premises. Trong Route 53, tạo latency-based record trỏ tới ba NLBs, và dùng nó làm origin cho Amazon CloudFront distribution. Cung cấp quyền truy cập ứng dụng bằng CNAME trỏ tới DNS của CloudFront.',
      D: 'Cấu hình ba Application Load Balancers (ALBs) ở ba AWS Regions để hướng tới các endpoint on-premises. Trong Route 53, tạo latency-based record trỏ tới ba ALBs, và dùng nó làm origin cho Amazon CloudFront distribution. Cung cấp quyền truy cập ứng dụng bằng CNAME trỏ tới DNS của CloudFront.',
    },
  },
  368: {
    questionVi:
      'Một kiến trúc sư giải pháp muốn tất cả người dùng mới có yêu cầu độ phức tạp cụ thể và chu kỳ xoay vòng bắt buộc cho password của IAM user. Kiến trúc sư giải pháp nên làm gì để thực hiện điều này?',
    optionsVi: {
      A: 'Đặt password policy tổng thể cho toàn bộ tài khoản AWS.',
      B: 'Đặt password policy cho mỗi IAM user trong tài khoản AWS.',
      C: 'Dùng phần mềm bên thứ ba để đặt yêu cầu password.',
      D: 'Gắn Amazon CloudWatch rule vào event Create_newuser để đặt password với yêu cầu phù hợp.',
    },
  },
  369: {
    questionVi:
      'Một công ty đã migrate ứng dụng lên Amazon EC2 Linux instances. Một trong các EC2 instances này chạy nhiều task kéo dài 1 giờ theo lịch. Các task này được viết bởi nhiều đội khác nhau và không có ngôn ngữ lập trình chung. Công ty lo ngại về hiệu năng và khả năng mở rộng khi các task này chạy trên một instance duy nhất. Kiến trúc sư giải pháp cần triển khai giải pháp giải quyết những lo ngại này. Giải pháp nào đáp ứng các yêu cầu này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Batch để chạy các task dưới dạng job. Lên lịch các job bằng Amazon EventBridge (Amazon CloudWatch Events).',
      B: 'Chuyển EC2 instance sang container. Dùng AWS App Runner để tạo container theo yêu cầu để chạy các task dưới dạng job.',
      C: 'Chuyển các task sang AWS Lambda functions. Lên lịch các Lambda functions bằng Amazon EventBridge (Amazon CloudWatch Events).',
      D: 'Tạo Amazon Machine Image (AMI) từ EC2 instance chạy các task. Tạo Auto Scaling group với AMI để chạy nhiều bản sao của instance.',
    },
  },
  370: {
    questionVi:
      'Một công ty chạy ứng dụng web ba tầng công khai trong VPC. Ứng dụng chạy trên Amazon EC2 instances trải trên nhiều Availability Zones. EC2 instances chạy trong private subnets cần giao tiếp với license server qua internet. Công ty cần giải pháp được quản lý giảm tối thiểu công sức bảo trì vận hành. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cấp phát NAT instance trong public subnet. Sửa route table của mỗi private subnet với default route trỏ tới NAT instance.',
      B: 'Cấp phát NAT instance trong private subnet. Sửa route table của mỗi private subnet với default route trỏ tới NAT instance.',
      C: 'Cấp phát NAT gateway trong public subnet. Sửa route table của mỗi private subnet với default route trỏ tới NAT gateway.',
      D: 'Cấp phát NAT gateway trong private subnet. Sửa route table của mỗi private subnet với default route trỏ tới NAT gateway.',
    },
  },
  371: {
    questionVi:
      'Một công ty cần tạo Amazon Elastic Kubernetes Service (Amazon EKS) cluster để host ứng dụng streaming media số. EKS cluster sẽ dùng managed node group được hỗ trợ bởi Amazon Elastic Block Store (Amazon EBS) volumes để lưu trữ. Công ty phải mã hóa toàn bộ dữ liệu at rest bằng customer managed key được lưu trong AWS Key Management Service (AWS KMS). Kết hợp hành động nào đáp ứng yêu cầu này với công sức vận hành THẤP NHẤT? (Chọn hai.)',
    optionsVi: {
      A: 'Dùng Kubernetes plugin dùng customer managed key để thực hiện mã hóa dữ liệu.',
      B: 'Sau khi tạo EKS cluster, xác định các EBS volumes. Bật mã hóa bằng customer managed key.',
      C: 'Bật EBS encryption theo mặc định ở AWS Region nơi EKS cluster sẽ được tạo. Chọn customer managed key làm key mặc định.',
      D: 'Tạo EKS cluster. Tạo IAM role có policy cấp quyền cho customer managed key. Liên kết role với EKS cluster.',
      E: 'Lưu customer managed key làm Kubernetes secret trong EKS cluster. Dùng customer managed key để mã hóa EBS volumes.',
    },
  },
  372: {
    questionVi:
      'Một công ty muốn migrate Oracle database lên AWS. Database gồm một bảng duy nhất chứa hàng triệu ảnh geographic information systems (GIS) có độ phân giải cao và được xác định bằng geographic code. Khi có thảm họa tự nhiên xảy ra, hàng chục nghìn ảnh được cập nhật mỗi vài phút. Mỗi geographic code có một ảnh hoặc dòng duy nhất tương ứng. Công ty muốn giải pháp có tính sẵn sàng cao và có khả năng mở rộng trong các sự kiện như vậy. Giải pháp nào đáp ứng các yêu cầu này TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Lưu ảnh và geographic code trong bảng database. Dùng Oracle chạy trên Amazon RDS Multi-AZ DB instance.',
      B: 'Lưu ảnh trong Amazon S3 buckets. Dùng Amazon DynamoDB với geographic code làm key và S3 URL của ảnh làm value.',
      C: 'Lưu ảnh và geographic code trong bảng Amazon DynamoDB. Cấu hình DynamoDB Accelerator (DAX) trong thời gian tải cao.',
      D: 'Lưu ảnh trong Amazon S3 buckets. Lưu geographic code và S3 URL của ảnh trong bảng database. Dùng Oracle chạy trên Amazon RDS Multi-AZ DB instance.',
    },
  },
  373: {
    questionVi:
      'Một công ty có ứng dụng thu thập dữ liệu từ các sensor IoT trên ô tô. Dữ liệu được streaming và lưu trong Amazon S3 qua Amazon Kinesis Data Firehose. Dữ liệu tạo ra hàng nghìn tỷ S3 object mỗi năm. Mỗi buổi sáng, công ty dùng dữ liệu 30 ngày trước để huấn luyện lại một bộ mô hình machine learning (ML). Bốn lần mỗi năm, công ty dùng dữ liệu 12 tháng trước để phân tích và huấn luyện các mô hình ML khác. Dữ liệu phải sẵn sàng với độ trễ tối thiểu trong tối đa 1 năm. Sau 1 năm, dữ liệu phải được giữ lại cho mục đích lưu trữ (archival). Giải pháp lưu trữ nào đáp ứng các yêu cầu này TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng storage class S3 Intelligent-Tiering. Tạo S3 Lifecycle policy để chuyển object sang S3 Glacier Deep Archive sau 1 năm.',
      B: 'Dùng storage class S3 Intelligent-Tiering. Cấu hình S3 Intelligent-Tiering tự động chuyển object sang S3 Glacier Deep Archive sau 1 năm.',
      C: 'Dùng storage class S3 Standard-Infrequent Access (S3 Standard-IA). Tạo S3 Lifecycle policy để chuyển object sang S3 Glacier Deep Archive sau 1 năm.',
      D: 'Dùng storage class S3 Standard. Tạo S3 Lifecycle policy để chuyển object sang S3 Standard-Infrequent Access (S3 Standard-IA) sau 30 ngày, sau đó sang S3 Glacier Deep Archive sau 1 năm.',
    },
  },
  374: {
    questionVi:
      'Một công ty đang chạy nhiều ứng dụng doanh nghiệp trong ba VPC riêng biệt tại Region us-east-1. Các ứng dụng phải có thể giao tiếp giữa các VPC. Các ứng dụng cũng phải liên tục gửi hàng trăm gigabyte dữ liệu mỗi ngày tới ứng dụng nhạy cảm về độ trễ chạy tại một data center on-premises duy nhất. Kiến trúc sư giải pháp cần thiết kế giải pháp kết nối mạng tối ưu chi phí nhất. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Cấu hình ba kết nối AWS Site-to-Site VPN từ data center tới AWS. Thiết lập kết nối bằng cách cấu hình một kết nối VPN cho mỗi VPC.',
      B: 'Khởi chạy virtual network appliance của bên thứ ba trong mỗi VPC. Thiết lập IPsec VPN tunnel giữa data center và mỗi virtual appliance.',
      C: 'Thiết lập ba kết nối AWS Direct Connect từ data center tới Direct Connect gateway ở us-east-1. Thiết lập kết nối bằng cách cấu hình mỗi VPC dùng một trong các kết nối Direct Connect.',
      D: 'Thiết lập một kết nối AWS Direct Connect từ data center tới AWS. Tạo transit gateway, và gắn mỗi VPC vào transit gateway. Thiết lập kết nối giữa kết nối Direct Connect và transit gateway.',
    },
  },
  375: {
    questionVi:
      'Một công ty ecommerce đang xây dựng ứng dụng phân tán gồm nhiều hàm serverless và dịch vụ AWS để hoàn thành các tác vụ xử lý đơn hàng. Các tác vụ này cần phê duyệt thủ công như một phần của workflow. Kiến trúc sư giải pháp cần thiết kế kiến trúc cho ứng dụng xử lý đơn hàng. Giải pháp phải có khả năng kết hợp nhiều AWS Lambda functions thành các ứng dụng serverless phản hồi nhanh. Giải pháp cũng phải điều phối dữ liệu và dịch vụ chạy trên Amazon EC2 instances, containers, hoặc server on-premises. Giải pháp nào đáp ứng các yêu cầu này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Step Functions để xây dựng ứng dụng.',
      B: 'Tích hợp toàn bộ thành phần ứng dụng trong một AWS Glue job.',
      C: 'Dùng Amazon Simple Queue Service (Amazon SQS) để xây dựng ứng dụng.',
      D: 'Dùng AWS Lambda functions và Amazon EventBridge events để xây dựng ứng dụng.',
    },
  },
  376: {
    questionVi:
      'Một công ty đã khởi chạy Amazon RDS for MySQL DB instance. Hầu hết kết nối tới database đến từ các ứng dụng serverless. Traffic ứng dụng tới database thay đổi đáng kể theo thời điểm ngẫu nhiên. Trong thời gian nhu cầu cao, người dùng báo lỗi database connection bị từ chối. Giải pháp nào giải quyết vấn đề này với công sức vận hành THẤP NHẤT?',
    optionsVi: {
      A: 'Tạo proxy trong RDS Proxy. Cấu hình ứng dụng của người dùng dùng DB instance qua RDS Proxy.',
      B: 'Triển khai Amazon ElastiCache for Memcached giữa ứng dụng của người dùng và DB instance.',
      C: 'Migrate DB instance sang instance class khác có khả năng I/O cao hơn. Cấu hình ứng dụng của người dùng dùng DB instance mới.',
      D: 'Cấu hình Multi-AZ cho DB instance. Cấu hình ứng dụng của người dùng chuyển đổi giữa các DB instances.',
    },
  },
  377: {
    questionVi:
      'Một công ty gần đây triển khai hệ thống audit mới để tập trung thông tin về phiên bản hệ điều hành, vá lỗi, và phần mềm đã cài trên Amazon EC2 instances. Kiến trúc sư giải pháp phải đảm bảo mọi instance được cấp phát qua EC2 Auto Scaling groups gửi báo cáo thành công tới hệ thống audit ngay khi được khởi chạy và chấm dứt. Giải pháp nào đạt được các mục tiêu này HIỆU QUẢ NHẤT?',
    optionsVi: {
      A: 'Dùng AWS Lambda function theo lịch và chạy script từ xa trên toàn bộ EC2 instances để gửi dữ liệu tới hệ thống audit.',
      B: 'Dùng EC2 Auto Scaling lifecycle hooks để chạy script tùy chỉnh gửi dữ liệu tới hệ thống audit khi instance được khởi chạy và chấm dứt.',
      C: 'Dùng EC2 Auto Scaling launch configuration để chạy script tùy chỉnh qua user data gửi dữ liệu tới hệ thống audit khi instance được khởi chạy và chấm dứt.',
      D: 'Chạy script tùy chỉnh trên hệ điều hành của instance để gửi dữ liệu tới hệ thống audit. Cấu hình script được gọi bởi EC2 Auto Scaling group khi instance khởi động và bị chấm dứt.',
    },
  },
  378: {
    questionVi:
      'Một công ty đang phát triển game multiplayer thời gian thực dùng UDP để giao tiếp giữa client và server trong Auto Scaling group. Các đợt tăng nhu cầu được dự đoán trong ngày, vì vậy nền tảng game server phải thích ứng phù hợp. Developer muốn lưu điểm số của người chơi và dữ liệu non-relational khác trong giải pháp database có thể tự scale mà không cần can thiệp. Kiến trúc sư giải pháp nên đề xuất giải pháp nào?',
    optionsVi: {
      A: 'Dùng Amazon Route 53 để phân bổ traffic và Amazon Aurora Serverless để lưu dữ liệu.',
      B: 'Dùng Network Load Balancer để phân bổ traffic và Amazon DynamoDB on-demand để lưu dữ liệu.',
      C: 'Dùng Network Load Balancer để phân bổ traffic và Amazon Aurora Global Database để lưu dữ liệu.',
      D: 'Dùng Application Load Balancer để phân bổ traffic và Amazon DynamoDB global tables để lưu dữ liệu.',
    },
  },
  379: {
    questionVi:
      'Một công ty host ứng dụng frontend dùng backend Amazon API Gateway API được tích hợp với AWS Lambda. Khi API nhận request, Lambda function nạp nhiều thư viện. Sau đó Lambda function kết nối tới Amazon RDS database, xử lý dữ liệu, và trả dữ liệu về ứng dụng frontend. Công ty muốn đảm bảo độ trễ phản hồi thấp nhất có thể cho toàn bộ người dùng với ít thay đổi nhất tới hoạt động vận hành của công ty. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Thiết lập kết nối trực tiếp giữa ứng dụng frontend và database để truy vấn nhanh hơn bằng cách bỏ qua API.',
      B: 'Cấu hình provisioned concurrency cho Lambda function xử lý request.',
      C: 'Cache kết quả truy vấn trong Amazon S3 để lấy nhanh hơn cho các dataset tương tự.',
      D: 'Tăng kích thước database để tăng số lượng kết nối Lambda có thể thiết lập cùng lúc.',
    },
  },
  380: {
    questionVi:
      'Một công ty đang migrate workload on-premises lên AWS Cloud. Công ty đã dùng nhiều Amazon EC2 instances và Amazon RDS DB instances. Công ty muốn giải pháp tự động start và stop EC2 instances và DB instances ngoài giờ làm việc. Giải pháp phải giảm tối thiểu chi phí và công sức bảo trì hạ tầng. Giải pháp nào đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Scale EC2 instances bằng elastic resize. Scale DB instances về zero ngoài giờ làm việc.',
      B: 'Tìm giải pháp đối tác trên AWS Marketplace tự động start và stop EC2 instances và DB instances theo lịch.',
      C: 'Khởi chạy thêm một EC2 instance. Cấu hình lịch crontab chạy shell script start và stop các EC2 instances và DB instances hiện có theo lịch.',
      D: 'Tạo AWS Lambda function start và stop EC2 instances và DB instances. Cấu hình Amazon EventBridge gọi Lambda function theo lịch.',
    },
  },
  381: {
    questionVi:
      'Một công ty host ứng dụng web ba tầng gồm PostgreSQL database. Database lưu metadata từ các tài liệu. Công ty tìm kiếm metadata theo từ khóa để lấy tài liệu mà công ty review trong báo cáo hằng tháng. Các tài liệu được lưu trong Amazon S3. Tài liệu thường chỉ được viết một lần, nhưng được cập nhật thường xuyên. Quy trình báo cáo mất vài giờ khi dùng truy vấn quan hệ. Quy trình báo cáo không được ngăn cản việc sửa tài liệu hoặc thêm tài liệu mới. Kiến trúc sư giải pháp cần triển khai giải pháp để đẩy nhanh quy trình báo cáo. Giải pháp nào đáp ứng các yêu cầu này với LƯỢNG THAY ĐỔI MÃ ỨNG DỤNG ÍT NHẤT?',
    optionsVi: {
      A: 'Thiết lập Amazon DocumentDB (with MongoDB compatibility) cluster mới có read replica. Scale read replica để tạo báo cáo.',
      B: 'Thiết lập Amazon Aurora PostgreSQL DB cluster mới có Aurora Replica. Gửi truy vấn tới Aurora Replica để tạo báo cáo.',
      C: 'Thiết lập Amazon RDS for PostgreSQL Multi-AZ DB instance mới. Cấu hình module báo cáo truy vấn secondary RDS node để module báo cáo không ảnh hưởng tới primary node.',
      D: 'Thiết lập bảng Amazon DynamoDB mới để lưu tài liệu. Dùng write capacity cố định để hỗ trợ thêm tài liệu mới. Tự động scale read capacity để hỗ trợ báo cáo.',
    },
  },
  382: {
    questionVi:
      'Một công ty có ứng dụng ba tầng trên AWS nạp dữ liệu sensor từ thiết bị của người dùng. Traffic đi qua Network Load Balancer (NLB), sau đó tới Amazon EC2 instances cho tầng web, và cuối cùng tới EC2 instances cho tầng ứng dụng. Tầng ứng dụng gọi tới database. Kiến trúc sư giải pháp nên làm gì để cải thiện bảo mật dữ liệu khi truyền (in transit)?',
    optionsVi: {
      A: 'Cấu hình TLS listener. Triển khai server certificate trên NLB.',
      B: 'Cấu hình AWS Shield Advanced. Bật AWS WAF trên NLB.',
      C: 'Đổi load balancer sang Application Load Balancer (ALB). Bật AWS WAF trên ALB.',
      D: 'Mã hóa Amazon Elastic Block Store (Amazon EBS) volume trên EC2 instances bằng AWS Key Management Service (AWS KMS).',
    },
  },
  383: {
    questionVi:
      'Một công ty đang lên kế hoạch migrate ứng dụng commercial off-the-shelf (COTS) từ data center on-premises lên AWS. Phần mềm có mô hình license dùng sockets và cores với yêu cầu capacity và uptime có thể dự đoán được. Công ty muốn dùng license hiện có, đã mua từ đầu năm nay. Tùy chọn giá Amazon EC2 nào TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dedicated Reserved Hosts',
      B: 'Dedicated On-Demand Hosts',
      C: 'Dedicated Reserved Instances',
      D: 'Dedicated On-Demand Instances',
    },
  },
  384: {
    questionVi:
      'Một công ty chạy ứng dụng trên Amazon EC2 Linux instances trải trên nhiều Availability Zones. Ứng dụng cần một storage layer có tính sẵn sàng cao và tuân thủ Portable Operating System Interface (POSIX). Storage layer phải cung cấp độ bền dữ liệu tối đa và có thể chia sẻ giữa các EC2 instances. Dữ liệu trong storage layer sẽ được truy cập thường xuyên trong 30 ngày đầu và ít truy cập sau đó. Giải pháp nào đáp ứng các yêu cầu này TIẾT KIỆM CHI PHÍ NHẤT?',
    optionsVi: {
      A: 'Dùng storage class S3 Standard. Tạo S3 Lifecycle policy để chuyển dữ liệu ít truy cập sang S3 Glacier.',
      B: 'Dùng storage class S3 Standard. Tạo S3 Lifecycle policy để chuyển dữ liệu ít truy cập sang S3 Standard-Infrequent Access (S3 Standard-IA).',
      C: 'Dùng storage class Amazon Elastic File System (Amazon EFS) Standard. Tạo lifecycle management policy để chuyển dữ liệu ít truy cập sang EFS Standard-Infrequent Access (EFS Standard-IA).',
      D: 'Dùng storage class Amazon Elastic File System (Amazon EFS) One Zone. Tạo lifecycle management policy để chuyển dữ liệu ít truy cập sang EFS One Zone-Infrequent Access (EFS One Zone-IA).',
    },
  },
  385: {
    questionVi:
      'Một kiến trúc sư giải pháp đang tạo thiết kế VPC mới. Có hai public subnets cho load balancer, hai private subnets cho web server, và hai private subnets cho MySQL. Web server chỉ dùng HTTPS. Kiến trúc sư giải pháp đã tạo security group cho load balancer cho phép cổng 443 từ 0.0.0.0/0. Chính sách công ty yêu cầu mỗi resource có quyền truy cập tối thiểu cần thiết để vẫn thực hiện được tác vụ của mình. Kiến trúc sư giải pháp nên dùng chiến lược cấu hình bổ sung nào để đáp ứng các yêu cầu này?',
    optionsVi: {
      A: 'Tạo security group cho web server và cho phép cổng 443 từ 0.0.0.0/0. Tạo security group cho MySQL server và cho phép cổng 3306 từ security group của web server.',
      B: 'Tạo network ACL cho web server và cho phép cổng 443 từ 0.0.0.0/0. Tạo network ACL cho MySQL server và cho phép cổng 3306 từ security group của web server.',
      C: 'Tạo security group cho web server và cho phép cổng 443 từ load balancer. Tạo security group cho MySQL server và cho phép cổng 3306 từ security group của web server.',
      D: 'Tạo network ACL cho web server và cho phép cổng 443 từ load balancer. Tạo network ACL cho MySQL server và cho phép cổng 3306 từ security group của web server.',
    },
  },
  386: {
    questionVi:
      'Một công ty ecommerce đang chạy ứng dụng multi-tier trên AWS. Cả tầng front-end và backend đều chạy trên Amazon EC2, và database chạy trên Amazon RDS for MySQL. Tầng backend giao tiếp với RDS instance. Có nhiều lệnh gọi thường xuyên trả về các dataset giống nhau từ database gây chậm hiệu năng. Hành động nào nên được thực hiện để cải thiện hiệu năng của tầng backend?',
    optionsVi: {
      A: 'Triển khai Amazon SNS để lưu các lệnh gọi database.',
      B: 'Triển khai Amazon ElastiCache để cache các dataset lớn.',
      C: 'Triển khai RDS for MySQL read replica để cache các lệnh gọi database.',
      D: 'Triển khai Amazon Kinesis Data Firehose để streaming các lệnh gọi tới database.',
    },
  },
};

const out = writeBatch(14, 362, 386, T);
console.log('Wrote', out);
