#!/usr/bin/env node
/** Generate agent-answers-batch15.js through batch20.js */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const ANSWERS = {
  387: { a: ['D', 'E'], s: 'CloudFormation least privilege → IAM user policy **chỉ CloudFormation** + **IAM role** launch stack.', q: 'Deployment engineer dùng CloudFormation, cần least privilege (Choose two).' },
  388: { a: ['D'], s: 'Web tier không kết nối RDS (default SG) → **RDS SG allow inbound từ web tier SG** port 3306.', q: 'Two-tier app: web EC2 public, RDS private, default SG/NACL — web không connect DB.' },
  389: { a: ['A'], s: 'Reporting không ảnh hưởng write → **RDS Read Replicas**.', q: 'RDS MySQL production write nặng, reporting queries cần tách khỏi write.' },
  390: { a: ['B', 'D'], s: 'Session durable ecommerce → **DynamoDB** hoặc **ElastiCache Redis** lưu session (Choose two).', q: 'Ecommerce ALB+ASG+RDS MariaDB Multi-AZ — session phải durable (Choose two).' },
  391: { a: ['C'], s: 'Stateless EC2 RPO 2h → **AMI mới nhất** web/app + **RDS automated backup PITR**.', q: 'Stateless web EC2 ASG + RDS PostgreSQL, RPO 2 giờ, backup scalable, không cần local storage.' },
  392: { a: ['A'], s: 'Public web + dynamic IP → web SG **443 từ 0.0.0.0/0**, RDS SG **3306 từ web SG**.', q: 'Public web EC2 + RDS MySQL, user IP động, cấu hình security groups.' },
  393: { a: ['C'], s: 'Audio → text + loại PII → **Amazon Transcribe** bật PII redaction + Lambda trigger S3.', q: 'Audio call S3 → transcribe text, remove PII khỏi transcript.' },
  394: { a: ['C'], s: 'RDS IOPS >20k trên gp3 → **Provisioned IOPS (io2)**.', q: 'RDS gp3 2000GB, performance degrade khi IOPS >20,000 — cải thiện storage performance.' },
  395: { a: ['C'], s: 'Audit IAM user thay đổi resource → **AWS CloudTrail**.', q: 'Cần xác định IAM user nào đổi security group rules tuần trước.' },
  396: { a: ['C'], s: 'DDoS DNS + Global Accelerator → **AWS WAF rate-based rule** gắn accelerator.', q: 'Self-managed DNS EC2 multi-Region + Global Accelerator — chống DDoS.' },
  397: { a: ['C'], s: 'Job S3 daily ~1 giờ, CPU/RAM cố định → **EventBridge schedule + ECS Fargate task**.', q: 'Daily job aggregate S3 (object 10GB, chạy ~1h), minimize operational effort.' },
  398: { a: ['C'], s: '600TB/2 tuần, 100Mbps không đủ → **Snowball Edge Storage Optimized**.', q: '600TB NAS on-prem → AWS trong 2 tuần, encrypted in transit, 100Mbps upload.' },
  399: { a: ['B'], s: 'API Gateway HTTP flood → **Regional WAF rate-based rule** gắn API stage.', q: 'API Gateway Regional stock prices — chống HTTP flood, least operational overhead.' },
  400: { a: ['C'], s: 'DynamoDB alert 4 team không ảnh hưởng app → **DynamoDB Streams → SNS**.', q: 'DynamoDB weather events — alert 4 internal teams, không impact app performance.' },
  401: { a: ['A'], s: 'HA + scale, no SPOF → **EC2 ASG multi-AZ + RDS Multi-AZ**.', q: 'Migrate on-prem app lên AWS: HA, scale, tránh single point of failure.' },
  402: { a: ['C'], s: 'Kinesis mất data → **tăng số shards** xử lý throughput.', q: 'EC2 → Kinesis → S3 mỗi 2 ngày nhưng S3 không nhận hết data từ Kinesis.' },
  403: { a: ['D'], s: 'Lambda upload S3 → **IAM execution role** gắn Lambda với S3 permissions.', q: 'Lambda upload S3 — grant permissions đúng cách.' },
  404: { a: ['D'], s: 'S3 trigger Lambda miss docs → **SQS buffer** làm event source Lambda.', q: 'S3 → Lambda process documents, marketing campaign miss nhiều files.' },
  405: { a: ['D', 'E'], s: 'Demo env scale + weekend off → **target tracking CPU** + **scheduled scaling** zero cuối tuần (Choose two).', q: 'Demo ALB+ASG, traffic cao giờ làm việc, không cần weekend (Choose two).' },
  406: { a: ['C', 'D'], s: 'Two-tier SG → web **443 public** + DB **3306 từ web SG** (Choose two).', q: 'Public web 443, RDS MySQL chỉ web servers port 3306 (Choose two).' },
  407: { a: ['D'], s: 'Lustre client, fully managed → **Amazon FSx for Lustre**.', q: 'Gaming shared storage, Lustre clients, fully managed.' },
  408: { a: ['B'], s: 'UDP global low latency + failover → **Global Accelerator + NLB + ECS Fargate**.', q: 'UDP từ remote devices, xử lý ngay, failover Region nhanh, không lưu data.' },
  409: { a: ['C'], s: 'Windows IIS file share HA → **FSx for Windows File Server Multi-AZ**.', q: 'Migrate Windows IIS, thay on-prem NAS file share — resilient + durable nhất.' },
  410: { a: ['B'], s: 'EBS encryption at rest → **tạo volume encrypted**, attach EC2.', q: 'EC2 ghi EBS — đảm bảo mọi data encrypted at rest.' },
  411: { a: ['C'], s: 'MySQL sporadic usage, no code change → **Aurora Serverless MySQL-compatible**.', q: 'Web app MySQL usage thất thường, migrate AWS cost-effective, không sửa DB schema.' },

  412: { a: ['D'], s: 'Chặn S3 public toàn account → **S3 Block Public Access** + **SCP** ngăn đổi setting.', q: 'Mọi S3 object phải private, tránh accidental public exposure.' },
  413: { a: ['B'], s: 'Email marketing/order chậm → **Amazon SES** thay EC2 gửi email.', q: 'Ecommerce email delays — giảm ops email delivery.' },
  414: { a: ['B'], s: 'CSV network share → S3 near-real-time → **S3 File Gateway**.', q: 'Hundreds CSV reports/day từ network share → AWS near-real-time, least admin.' },
  415: { a: ['A'], s: 'S3 access pattern unknown → **Lifecycle → Intelligent-Tiering**.', q: 'Petabytes S3 Standard, access pattern không rõ — optimize cost mỗi bucket.' },
  416: { a: ['B', 'D'], s: 'Slow ecommerce pages → **CloudFront** static + **RDS read replica** (Choose two).', q: 'Ecommerce static+dynamic, RDS OLTP, slow page loads (Choose two).' },
  417: { a: ['C'], s: 'Lambda→EC2 private 1 năm, tiết kiệm → **Compute Savings Plan** + Lambda **VPC private subnet**.', q: 'Lambda cần network access EC2 private subnet, maximize savings 1+ năm.' },
  418: { a: ['B'], s: 'Cross-account S3 role → thêm **dev account principal** vào trust policy production role.', q: 'IAM role production S3, dev users cần access least privilege.' },
  419: { a: ['A', 'E'], s: 'EBS encryption bắt buộc → **default EBS encryption** EC2 console + **Organizations default encryption** (Choose two).', q: 'Organizations: mọi EBS mới phải encrypted, minimal impact employees (Choose two).' },
  420: { a: ['D'], s: 'PostgreSQL HA failover <40s, read offload rẻ → **RDS Multi-AZ DB cluster**, reader endpoint.', q: 'RDS PostgreSQL cluster: HA, failover <40s, offload reads, cost thấp.' },
  421: { a: ['C'], s: 'Serverless SFTP high IOPS → **Transfer Family SFTP + S3** encryption.', q: 'Thay EC2 SFTP bằng serverless, high IOPS, security configurable.' },
  422: { a: ['D'], s: 'ML async API irregular load → **API → SQS → ECS Auto Scaling** theo queue.', q: 'ML microservices 1GB S3 startup, async batch, usage irregular.' },
  423: { a: ['A', 'B'], s: 'Identity-based policy → attach **IAM Role** và **IAM Group** (Choose two).', q: 'Identity-based IAM policy — principals nào attach được? (Choose two.)' },
  424: { a: ['B'], s: 'Frontend 24/7, backend burst → **RI frontend + Spot backend**.', q: 'EC2 frontend always-on, backend short bursts — cost-effective scale.' },
  425: { a: ['C'], s: '≤15k IOPS, tách IOPS khỏi capacity → **gp3** cost-effective.', q: 'Peak 15k IOPS, provision disk performance independent of capacity — cost-effective EBS.' },
  426: { a: ['A'], s: 'Healthcare migrate + audit → **DataSync** + **CloudTrail data events** S3.', q: 'Healthcare data migrate AWS, audit access all levels, data thay đổi thường xuyên.' },
  427: { a: ['B'], s: 'Java Tomcat HA → **Elastic Beanstalk** load-balanced + rolling deploy.', q: 'Complex Java Tomcat + MySQL, deploy highly available.' },
  428: { a: ['B'], s: 'Lambda DynamoDB secure → **IAM execution role**, Lambda trusted service.', q: 'Serverless API Gateway+Lambda+DynamoDB — Lambda access DB most securely.' },
  429: { a: ['D'], s: 'IAM MFA condition → Stop/Terminate **us-east-1 + MFA**; EC2 khác permitted trong region.', q: 'IAM group policy duy nhất có MFA condition — effective permissions?' },
  430: { a: ['B', 'C'], s: 'CSV→image Lambda + lifecycle CSV Glacier, expire image 30 ngày (Choose two).', q: 'Sensors CSV→images ASAP, images irrelevant 1 month, CSV giữ cho ML (Choose two).' },
  431: { a: ['B'], s: 'Game scoreboard near-real-time → **ElastiCache Redis** compute+cache scores.', q: 'Video game RDS MySQL, top-10 scoreboard near-real-time, preserve scores.' },
  432: { a: ['B'], s: 'ML + BI dashboards → **SageMaker** train + **QuickSight** visualize.', q: 'ML models + reporting platform BI dashboards, least operational overhead.' },
  433: { a: ['C'], s: 'Ngăn sửa cost tags → **SCP** deny tag modification trừ authorized principals.', q: 'Organizations: prevent modification cost usage tags.' },
  434: { a: ['A'], s: 'DR Region minimal downtime → **warm standby**: ASG+LB DR, **DynamoDB global table**, Route53 failover.', q: 'EC2+ELB+ASG+DynamoDB — available another Region minimal downtime.' },
  435: { a: ['A'], s: '20TB MySQL 2 tuần minimal downtime → **Snowball Edge + DMS** ongoing replication.', q: '20TB MySQL on-prem → AWS 2 tuần, minimal downtime, cost-effective.' },
  436: { a: ['A'], s: 'RDS PostgreSQL workload tăng, không thêm infra → **RI + scale up** instance lớn hơn.', q: 'RDS PostgreSQL workload tăng sau launch product — accommodate without adding infrastructure.' },

  437: { a: ['B'], s: 'ALB DDoS IP động → **AWS WAF rate-based rule** gắn ALB.', q: 'Ecommerce ALB, illegitimate requests IP thay đổi — block minimal impact legitimate users.' },
  438: { a: ['D'], s: 'Share RDS auditor cross-account → **encrypted snapshot share** + KMS key access.', q: 'RDS private subnet, auditor AWS account riêng cần copy database — most secure.' },
  439: { a: ['A'], s: 'VPC hết IP → **thêm IPv4 CIDR block** + subnets mới, least ops.', q: 'VPC IP range nhỏ, EC2 tăng, không đủ IP — least operational overhead.' },
  440: { a: ['A', 'C'], s: 'Aurora từ MySQL backup → **import RDS snapshot** hoặc **mysqldump S3 import** (Choose two).', q: 'Restore MySQL backup lên Aurora MySQL-compatible (Choose two).' },
  441: { a: ['C'], s: 'Static content scale EC2 → **CloudFront + S3** cho static web.', q: 'ASG scale vì static content traffic — redesign cost-effective.' },
  442: { a: ['D'], s: 'Lake Formation cross-account share → **tag-based access control**.', q: 'Lake Formation petabytes data, share selective với engineering team accounts.' },
  443: { a: ['C'], s: 'Global upload/download GB → **EC2 ASG + CloudFront**.', q: 'Scalable web app global users, upload/download GB — minimize latency.' },
  444: { a: ['B'], s: 'Maximize reliability → **RDS Multi-AZ + deletion protection**, EC2 **ASG multi-AZ + ALB**.', q: '2 EC2 single AZ + RDS, DB bị xóa nhầm downtime 24h — maximize reliability.' },
  445: { a: ['A'], s: '700TB NAS + Direct Connect, access during transfer → **DataSync agent** scheduled tasks.', q: '700TB NAS hybrid 10Gbps DX, 90 ngày migrate, vẫn access/update during transfer.' },
  446: { a: ['D'], s: 'S3 retain 7 năm legal → **Object Lock compliance** + **S3 Batch Operations** existing data.', q: 'PDF S3 phải retain 7 năm legal — least operational overhead.' },
  447: { a: ['A'], s: 'Multi-Region Lambda API failover → **Route 53 health checks active-active failover**.', q: 'Stateless Lambda API Gateway multi-Region — route traffic failover.' },
  448: { a: ['C'], s: 'VPN SPOF → **second VPN** từ Management VPC tới second customer gateway.', q: 'Management VPN single device SPOF — mitigate single point of failure.' },
  449: { a: ['B'], s: 'Oracle privileged third-party → **RDS Custom for Oracle**.', q: 'Oracle migrate AWS, third-party features cần privileged access, cost-effective.' },
  450: { a: ['C', 'E', 'F'], s: 'Three-tier Well-Architected → **refactor tiers multi-AZ**, **ELB+SG refs**, **RDS Multi-AZ cluster** (Choose three).', q: 'Single-server three-tier migrate AWS — security, scalability, resiliency (Choose three).' },
  451: { a: ['B', 'C', 'F'], s: 'Shared responsibility customer ops → **create RDS**, **ECS software**, **DX encryption in transit** (Choose three).', q: 'ECS+Direct Connect+RDS — activities operational team quản lý (Choose three).' },
  452: { a: ['B'], s: 'Java job 10s/hour → **Lambda + EventBridge schedule** thay EC2 always-on.', q: 'Java job hourly 10 giây, 1GB RAM — optimize cost.' },
  453: { a: ['D'], s: 'Backup không được sửa retention → **AWS Backup vault lock compliance mode**.', q: 'EC2+S3 backup regulatory retention — files không được alter trong retention.' },
  454: { a: ['C'], s: 'Map workloads multi-account → **Workload Discovery on AWS** architecture diagrams.', q: 'Resources nhiều Region/account, cần inventory và relationship map — most efficient.' },
  455: { a: ['B', 'D', 'F'], s: 'Budget alert + block provision → **Budgets billing**, **IAM role Budgets**, **SCP budget action** (Choose three).', q: 'Organizations per-account budgets, alert và auto prevent provisioning (Choose three).' },
  456: { a: ['C'], s: 'Cross-Region EC2 backup cost-effective → **AWS Backup cross-Region backup**.', q: 'EC2 backup Region 2, provision centrally, most cost-effective.' },
  457: { a: ['C'], s: 'AS2 + corporate IdP → **Transfer Family** + **Lambda IdP authentication**.', q: 'AS2 protocol transfer data, authenticate users với company IdP.' },
  458: { a: ['B', 'C'], s: 'API Gateway REST relational 1GB/2GB → **Lambda** + **RDS** (Choose two).', q: 'REST API 1GB memory 2GB storage, relational data — least admin (Choose two).' },
  459: { a: ['A'], s: 'Cost by department tag → **user-defined cost allocation tag** management account + Cost Explorer group tag.', q: 'Organizations department tags — EC2 spending theo department cross-account.' },
  460: { a: ['C'], s: 'Salesforce ↔ S3 encrypted → **Amazon AppFlow**.', q: 'Salesforce secure exchange S3, KMS CMK at rest, encrypt in transit.' },
  461: { a: ['B'], s: 'Mobile game TCP+UDP global → **Global Accelerator + NLB**.', q: 'Gaming EC2 ASG DynamoDB, TCP+UDP global lowest latency.' },

  462: { a: ['B'], s: 'Order spike Aurora → **SQS buffer** + ASG/ALB workers ghi DB.', q: 'EC2 orders → Aurora, traffic cao process chậm — write reliably nhanh nhất.' },
  463: { a: ['C'], s: 'IoT 2MB/night, 30s, 1GB RAM → **Lambda Python** cost-effective.', q: 'Mattress sensors 2MB/night S3, process 30s 1GB memory — cost-effective.' },
  464: { a: ['B'], s: 'PostgreSQL Single-AZ no code change → **snapshot restore RDS Multi-AZ**.', q: 'RDS PostgreSQL Single-AZ eliminate SPOF, no application code changes.' },
  465: { a: ['C'], s: 'Multi-instance simultaneous EBS write → **io2 Multi-Attach**.', q: 'Nitro EC2 cùng AZ write multiple EBS volumes simultaneously.' },
  466: { a: ['A'], s: 'Stateless EC2 single AZ → **Multi-AZ ASG + ALB** (RDS đã Multi-AZ).', q: 'Stateless two-tier EC2 single AZ, RDS Multi-AZ — make application highly available.' },
  467: { a: ['B'], s: 'Savings Plan underutilized member → **discount sharing** từ Organizations management account.', q: 'Compute Savings Plan member account dùng <50% — share discount org-wide.' },
  468: { a: ['B'], s: 'REST API private ECS → **API Gateway REST + VPC private link** ECS.', q: 'REST APIs frontend, backend containers private VPC subnets.' },
  469: { a: ['C'], s: 'S3 unpredictable access → **Lifecycle → Intelligent-Tiering**.', q: 'S3 raw data access pattern unpredictable — reduce costs.' },
  470: { a: ['D'], s: 'IPv6 outbound only, block inbound → **egress-only internet gateway**.', q: 'EC2 IPv6 initiate outbound internet, external không initiate inbound.' },
  471: { a: ['C'], s: 'VPC containers S3 1TB/day no internet → **gateway VPC endpoint S3**.', q: 'Containers VPC access S3 1TB/day, minimize cost, no internet traversal.' },
  472: { a: ['A'], s: 'DynamoDB read latency minimal changes → **DAX**.', q: 'Mobile chat DynamoDB, new messages low latency, minimal application changes.' },
  473: { a: ['A'], s: 'Static site ALB cost → **CloudFront** cache static ở edge.', q: 'Static website ALB, traffic tăng lo cost — CloudFront cache.' },
  474: { a: ['C'], s: 'Multi-Region VPC mesh → **Transit Gateway + TGW peering**.', q: 'VPCs isolated per Region phải communicate all Regions — least admin.' },
  475: { a: ['C'], s: 'ECS shared FS cross-Region backup → **EFS Standard** + AWS Backup replication.', q: 'ECS shared file mount/AZ, RPO 8h cross-Region, AWS Backup replication.' },
  476: { a: ['C'], s: 'IAM groups secure permissions → **least privilege policy attach to groups**.', q: 'IAM groups by department — most secure way grant permissions new users.' },
  477: { a: ['B'], s: 'S3 delete fail → thêm **s3:DeleteObject** trên `bucket/*` resource ARN.', q: 'IAM group list S3 bucket nhưng không delete objects — fix policy statement.' },
  478: { a: ['B'], s: 'Public files no edit until date → **S3 versioning + Object Lock retention** static hosting.', q: 'Law firm public files, prohibit modification/deletion until future date — most secure.' },
  479: { a: ['B'], s: 'Prototype → automated multi-AZ → **CloudFormation template** deploy.', q: 'Validated prototype ASG+ALB+RDS — automated deploy 2 AZ.' },
  480: { a: ['B'], s: 'EC2↔S3 no public internet → **VPC endpoint** (gateway S3).', q: 'EC2 S3 encrypted, traffic không traverse public internet.' },
  481: { a: ['B'], s: 'Cache luôn match DB on write → **write-through caching**.', q: 'ElastiCache + RDS MySQL — cache data match DB khi customer add item.' },
  482: { a: ['B'], s: '100GB on-prem S3 encrypted → **AWS DataSync**.', q: '100GB historical data on-prem → S3 encrypted in transit, least ops.' },
  483: { a: ['C'], s: 'Windows container 10 phút/lần → **ECS Fargate scheduled task**.', q: 'Windows .NET container job every 10 min, 1-3 min runtime — cost-effective.' },
  484: { a: ['A', 'E'], s: 'Multi-account SSO → **Organizations all features** + **IAM Identity Center** corporate directory (Choose two).', q: 'Consolidate AWS accounts, centralized corporate directory auth (Choose two).' },
  485: { a: ['A'], s: 'Video archive rare access, restore ≤5 phút → **Glacier Expedited retrieval**.', q: 'News footage archives, rarely restore, max 5 minutes when needed — cost-effective.' },
  486: { a: ['A'], s: 'Three-tier simplify ops → **S3 static + ECS Fargate + RDS**.', q: 'Presentation static, logic containers, relational DB — simplify deployment reduce ops.' },

  487: { a: ['C'], s: 'NFS on-prem+cloud HA → **EFS multiple mount targets** qua VPN.', q: 'File system mountable Linux on-prem+AWS qua VPN, HA scalable no min size.' },
  488: { a: ['C'], s: 'Member billing inaccessible → **SCP deny billing** root OU.', q: 'Organizations: member account billing không accessible kể cả root user.' },
  489: { a: ['C'], s: 'SNS failed messages 14 ngày → **SNS DLQ → SQS** retention 14 days.', q: 'SNS HTTPS on-prem miss messages — retain undelivered analyze 14 days.' },
  490: { a: ['B'], s: 'DynamoDB continuous backup S3 → **export/PITR** native continuous backups.', q: 'DynamoDB continuous backups S3 minimal coding, no RCU impact.' },
  491: { a: ['A'], s: 'Credit card async secure → **SQS standard + Lambda + SSE-KMS**, kms:Decrypt role.', q: 'Async credit card validation, secure, at-least-once, cost-effective.' },
  492: { a: ['D'], s: 'Restrict EC2 types centrally → **AWS Service Catalog** approved products.', q: 'Dev accounts oversized EC2 — centrally restrict resource creation least effort.' },
  493: { a: ['D', 'E', 'F'], s: 'Call sentiment AI → **Transcribe** + **Translate** + **Comprehend** (Choose three).', q: 'Multi-language call recordings → English text sentiment reports, no ML ops (Choose three).' },
  494: { a: ['D'], s: 'EC2 terminate 403 → request **không từ CIDR** 192.0.2.0/24 hoặc 203.0.113.0/24.', q: 'IAM role terminate EC2 bị 403 — policy có IP condition.' },
  495: { a: ['C'], s: 'PII trong Lake Formation S3 → **Amazon Macie** data discovery.', q: 'Audit S3 Lake Formation — discover PII/financial data passport credit card.' },
  496: { a: ['B', 'D'], s: 'On-prem NFS+block cache → **Storage Gateway file** + **volume gateway** (Choose two).', q: 'On-prem NFS+block storage out of space, local caching no re-architect (Choose two).' },
  497: { a: ['C'], s: 'S3 qua NAT expensive → **gateway VPC endpoint S3** private subnet.', q: 'EC2 private subnet S3 qua NAT — reduce data transfer cost.' },
  498: { a: ['A'], s: 'S3 versioning 2 versions → **Lifecycle noncurrent version expiration** keep 2.', q: 'S3 versioning retain 2 most recent versions — reduce cost least ops.' },
  499: { a: ['D'], s: '1Gbps DX <10% util → **200 Mbps hosted connection** qua partner.', q: 'Minimize 1Gbps Direct Connect cost, avg utilization <10%, maintain security.' },
  500: { a: ['A', 'D'], s: 'Windows files → FSx → **DataSync agents** + **Snowcone DataSync** (Choose two).', q: 'Migrate Windows file servers FSx preserve permissions (Choose two).' },
  501: { a: ['A'], s: 'Payment real-time analytics → **Kinesis Data Streams + Lambda**.', q: 'Payment data mỗi phút, real-time analyze rồi ingest data lake — most efficient.' },
  502: { a: ['C', 'E'], s: 'CMS performance resilience → **EFS images** + **ASG+ALB+CloudFront** (Choose two).', q: 'EC2 CMS EBS images, Aurora MySQL — improve performance resilience (Choose two).' },
  503: { a: ['A'], s: 'Cross-account monitoring → customer **IAM role trust** company account.', q: 'Monitoring service access customer EC2/CloudWatch — most secure cross-account.' },
  504: { a: ['C'], s: 'Hundreds VPCs → **Transit Gateway** networking account static routes.', q: 'Hundreds VPCs us-east-1 hundreds accounts — connect most efficient.' },
  505: { a: ['C'], s: 'Nightly batch cost-effective → **Spot Instances ASG** scale on CPU.', q: 'Batch 12AM-6AM On-Demand, retry on fail — most cost-effective.' },
  506: { a: ['C'], s: 'Photo upload scale → **S3 presigned URLs** direct browser upload.', q: 'Social media photo upload spikes — most scalable solution.' },
  507: { a: ['A'], s: 'Global reservation <1s write → **DynamoDB global table**.', q: 'Travel app global deploy, single primary reservation DB globally consistent <1s latency.' },
  508: { a: ['B', 'D'], s: 'EC2 cross-Region backup automated → **AMI lifecycle cross-Region** + **AWS Backup cross-Region** (Choose two).', q: 'Windows EC2 us-west-1 backup us-west-2 automated ≤24h RPO (Choose two).' },
  509: { a: ['B'], s: 'Block few bad IPs immediate → **NACL deny inbound** web tier subnets.', q: 'Illegitimate requests few IPs slow app — immediate fix (SG cannot deny).' },
  510: { a: ['B'], s: 'Cross-Region VPC DB → **VPC peering** + routes + **SG reference by SG ID**.', q: 'eu-west-1 app access ap-southeast-2 RDS securely.' },
  511: { a: ['C'], s: 'Dev PostgreSQL half day → **Aurora Serverless PostgreSQL**.', q: 'Multiple dev PostgreSQL environments used 4h/day — cost-effective.' },

  512: { a: ['A'], s: 'Backup all resources → **AWS Config** find untagged, tag programmatically, backup by tag.', q: 'Organizations backup all AWS resources — least operational overhead.' },
  513: { a: ['A'], s: 'Image resize unpredictable → **S3 + Lambda** resize on upload.', q: 'Social media image upload resize multi-device, unpredictable traffic HA scalable.' },
  514: { a: ['B'], s: 'EKS private endpoint nodes fail join → **interface VPC endpoints** control plane.', q: 'EKS private API, nodes private subnet cannot join — fix connectivity.' },
  515: { a: ['A', 'C', 'E'], s: 'Redshift use cases → **data APIs**, **off-hours analytics**, **petabyte scale** (Choose three).', q: 'Migrate on-prem app Redshift — suitable use cases (Choose three).' },
  516: { a: ['B'], s: 'Financial API peak consistent latency → **API Gateway + Lambda provisioned concurrency**.', q: 'API financial info peak usage, consistent low latency, least ops.' },
  517: { a: ['A'], s: 'Session Manager logs S3 → **SSM Session Manager S3 logging** console.', q: 'Archive Systems Manager Session Manager logs S3 — most operational efficiency.' },
  518: { a: ['A'], s: 'RDS low disk no downtime → **storage autoscaling**.', q: 'RDS MySQL low disk space — increase without downtime least effort.' },
  519: { a: ['B'], s: 'Central deploy customer solutions → **AWS Service Catalog** products.', q: 'Consulting company centrally manage deploy self-service solutions customers.' },
  520: { a: ['B'], s: 'DynamoDB unpredictable traffic → **on-demand Standard** table class.', q: 'EC2 app DynamoDB unpredictable read/write moderate-high — cost-effective scale.' },
  521: { a: ['C'], s: 'Cross-account DynamoDB → **IAM role STS AssumeRole** per business account.', q: 'Central inventory app read all teams DynamoDB tables — most secure auth.' },
  522: { a: ['B', 'C'], s: 'EKS autoscale → **HPA** + **Cluster Autoscaler** (Choose two).', q: 'EKS scale workload inconsistent — least ops (Choose two).' },
  523: { a: ['A'], s: 'Serverless multi DynamoDB no perf hit → **AppSync pipeline resolvers**.', q: 'Serverless web app multiple DynamoDB tables retrieve data no baseline impact.' },
  524: { a: ['C'], s: 'CloudTrail IAM errors → **Athena query** CloudTrail logs.', q: 'Analyze Access Denied/Unauthorized IAM errors CloudTrail — least effort.' },
  525: { a: ['A'], s: 'Cost data programmatic → **Cost Explorer API** pagination.', q: 'Usage cost dashboard programmatic current year + 12-month forecast — least ops.' },
  526: { a: ['D'], s: 'Aurora failover downtime → **RDS Proxy** reduce connection impact.', q: 'Aurora PostgreSQL manual failover 3 min downtime scaling exercise — reduce downtime.' },
  527: { a: ['D'], s: 'Streaming global fault tolerance → **Aurora global database** + Region 2 deploy + Route53 failover.', q: 'Regional streaming EC2+Aurora global expand minimal downtime most fault tolerant.' },
  528: { a: ['D'], s: 'FTP S3 process → **Transfer Family → S3 + Lambda** S3 event trigger.', q: 'FTP small files process 3-8 min delete after — operationally efficient.' },
  529: { a: ['B'], s: 'Transactional DB security → **RDS encryption at rest** managed.', q: 'Migrate transactional sensitive databases — security + reduce ops.' },
  530: { a: ['C'], s: 'Gaming TCP+UDP multi-Region → **Global Accelerator** front NLBs.', q: 'Online game NLB multi-Region TCP UDP — improve performance decrease latency.' },
  531: { a: ['A'], s: 'Lambda webhook third party → **Lambda Function URL**.', q: 'Third-party webhook call Lambda retrieve data — most operational efficiency.' },
  532: { a: ['A', 'D', 'F'], s: 'Per-customer API URL → **wildcard Route53+ACM** + **API GW custom domain** (Choose three).', q: 'API Gateway individual secure customer URLs Route53 (Choose three).' },
  533: { a: ['A'], s: 'S3 PII auto detect → **Macie + EventBridge SensitiveData + SNS** security team.', q: 'S3 must not contain PII — auto detect notify security.' },
  534: { a: ['B'], s: 'Logs S3 30 hot 60 cold 90 delete → **Standard-IA 30d → Glacier Flexible**, expire 90d.', q: 'Centralized logs S3: 30d frequent, 60d backup, delete 90d — cost-effective.' },
  535: { a: ['B'], s: 'EKS etcd secrets encrypt → **EKS KMS secrets encryption** cluster.', q: 'EKS secrets in etcd must be encrypted.' },
  536: { a: ['D'], s: 'PostgreSQL read scientists HA → **Multi-AZ cluster readable standbys**.', q: 'RDS PostgreSQL Single-AZ, data scientists read-only near real-time, HA cost-effective.' },
};

function guessWrongVi(en) {
  const t = (en || '').toLowerCase();
  if (t.includes('root user')) return 'Root user — vi phạm least privilege và best practice bảo mật.';
  if (t.includes('administratoraccess') || t.includes('poweruser')) return 'Quyền IAM quá rộng — không đáp ứng least privilege.';
  if (t.includes('nat gateway') || t.includes('nat instance')) return 'NAT — traffic S3/Internet tốn phí hơn VPC endpoint.';
  if (t.includes('snowmobile')) return 'Snowmobile — overkill cho workload nhỏ hơn, chi phí rất cao.';
  if (t.includes('on-demand') && t.includes('instance')) return 'On-Demand 24/7 — không tối ưu chi phí sustained/batch workload.';
  if (t.includes('spot') && t.includes('frontend')) return 'Spot cho tier cần chạy 24/7 — có thể bị interrupt.';
  if (t.includes('elasticache') && t.includes('memcached')) return 'Memcached — không hỗ trợ compute phức tạp như Redis cho scoreboard.';
  if (t.includes('comprehend') && t.includes('translat')) return 'Comprehend — NLP text, không transcribe audio.';
  if (t.includes('polly')) return 'Polly — text-to-speech, không speech-to-text.';
  if (t.includes('lex')) return 'Lex — chatbot, không sentiment analysis report.';
  if (t.includes('inspector')) return 'Inspector — vulnerability scan EC2/container, không phải PII trong S3.';
  if (t.includes('guardduty') && t.includes('rate')) return 'GuardDuty — threat detection, không có rate-limiting WAF.';
  if (t.includes('cloudwatch') && t.includes('monitor') && t.includes('alert')) return 'CloudWatch alert — reactive, không block attack như WAF.';
  if (t.includes('multi-az') && t.includes('read')) return 'Multi-AZ standby — không phục vụ read workload (cần read replica/cluster reader).';
  if (t.includes('read replica') && t.includes('route 53')) return 'Read replica + Route53 weighted — không failover DB write, không thay Multi-AZ.';
  if (t.includes('internet gateway') && t.includes('ipv6')) return 'Internet gateway — cho phép inbound initiation từ internet.';
  if (t.includes('interface endpoint') && t.includes('s3')) return 'S3 dùng gateway endpoint (free), không cần interface endpoint.';
  if (t.includes('amazon rds') && t.includes('lambda') && t.includes('15')) return 'Lambda max timeout 15 phút — không chạy job dài hơn.';
  if (t.includes('sqs') && t.includes('sns') && t.includes('subscribe') && t.includes('database')) return 'SNS không push trực tiếp vào database — cần consumer.';
  return 'Không đáp ứng đúng yêu cầu đề bài hoặc chi phí/ops/bảo mật kém hơn phương án đúng.';
}

const MULTI_EXPL = {
  387: { D: 'IAM user + group policy chỉ allow CloudFormation actions — least privilege.', E: 'IAM role định nghĩa permission stack cụ thể để launch CloudFormation — best practice.' },
  390: { B: 'DynamoDB — session durable, shared across ASG instances.', D: 'ElastiCache Redis — in-memory session store durable, scale tốt.' },
  405: { D: 'Target tracking scaling theo CPU — scale out khi demand tăng.', E: 'Scheduled scaling về 0 cuối tuần — tiết kiệm khi không cần chạy.' },
  406: { C: 'Web SG allow HTTPS 443 từ internet (0.0.0.0/0).', D: 'RDS SG allow MySQL 3306 chỉ từ web tier security group.' },
  416: { B: 'CloudFront cache static content — giảm load EC2/RDS.', D: 'RDS read replica — offload read queries khỏi primary.' },
  419: { A: 'Bật default EBS encryption attribute trong EC2 console Region.', E: 'Organizations management account bật default EBS encryption toàn org.' },
  423: { A: 'Identity-based policy attach được vào IAM Role.', B: 'Identity-based policy attach được vào IAM Group.' },
  430: { B: 'Lambda convert CSV→image ngay khi upload — nhanh nhất.', C: 'Lifecycle CSV→Glacier sau 1 ngày; expire images sau 30 ngày — cost-effective.' },
  440: { A: 'Import RDS snapshot trực tiếp sang Aurora — nhanh nhất từ snapshot.', C: 'mysqldump upload S3 rồi import Aurora — restore từ logical dump.' },
  450: { C: 'Refactor 3 tier, mỗi tier subnet riêng multi-AZ với ASG.', E: 'ELB trước web tier; SG reference giữa các layer.', F: 'RDS Multi-AZ cluster private subnet, chỉ app tier access.' },
  451: { B: 'Tạo RDS instance — trách nhiệm customer ops team.', C: 'Cài/config software monitoring trên ECS — customer.', F: 'Mã hóa data in transit qua Direct Connect — customer cấu hình.' },
  455: { B: 'AWS Budgets set amount trong billing dashboard từng account.', D: 'IAM role cho Budgets thực hiện budget actions.', F: 'Budget action dùng SCP ngăn provision thêm resources.' },
  458: { B: 'Lambda — serverless compute cho API, ít admin.', C: 'RDS — relational database managed, phù hợp yêu cầu relational.' },
  484: { A: 'Organizations all features — cần cho multi-account SCP/SSO.', E: 'IAM Identity Center tích hợp corporate directory — centralized SSO.' },
  493: { D: 'Transcribe — speech-to-text đa ngôn ngữ.', E: 'Translate — chuyển text sang English.', F: 'Comprehend — sentiment analysis report.' },
  496: { B: 'Storage Gateway file gateway — NFS với local cache.', D: 'Storage Gateway volume gateway — block storage cache.' },
  500: { A: 'DataSync agent — preserve permissions migrate Windows files.', D: 'Snowcone + DataSync — thiết bị edge cho site hạn chế bandwidth.' },
  502: { C: 'EFS mount images trên mọi EC2 instance — shared storage.', E: 'AMI+ASG+ALB+CloudFront — HA và cache static global.' },
  508: { B: 'AMI lifecycle policy snapshot + cross-Region copy tự động.', D: 'AWS Backup plan tag-based + cross-Region copy destination us-west-2.' },
  515: { A: 'Redshift Data API — truy cập data từ app/event-driven.', C: 'Chạy analytics off-hours khi app không active.', E: 'Scale petabytes, hàng chục triệu requests/phút — warehouse scale.' },
  522: { B: 'HPA scale pods theo CPU/custom metrics.', C: 'Cluster Autoscaler scale worker nodes theo pod demand.' },
  532: { A: 'Route 53 wildcard record trỏ API Gateway custom domain.', D: 'ACM wildcard cert cùng Region với API Gateway.', F: 'API Gateway custom domain import ACM cert.' },
};

function correctVi(meta, key) {
  if (meta.expl && meta.expl[key]) return `✅ ${meta.expl[key].replace(/^✅\s*/, '')}`;
  if (MULTI_EXPL[meta.n] && MULTI_EXPL[meta.n][key]) return `✅ ${MULTI_EXPL[meta.n][key]}`;
  const tail = meta.s.includes('→') ? meta.s.split('→').pop().trim().replace(/\*\*/g, '') : meta.s.replace(/\*\*/g, '');
  return `✅ ${tail} — giải pháp phù hợp SAA-C03.`;
}

const SPECIFIC_WRONG = {
  387: { A: 'Root user — vi phạm least privilege và security best practice.', B: 'PowerUsers — quyền quá rộng, không chỉ CloudFormation.', C: 'AdministratorAccess — không least privilege.', E: null },
  388: { A: 'NACL default allow; vấn đề là SG RDS chưa allow web tier.', B: 'Route table default đủ; DB layer cần SG rule.', C: 'VPC peering không cần — cùng VPC.', D: null },
  389: { B: 'ELB trước RDS — không scale database writes.', C: 'Scale up — reporting vẫn impact production.', D: 'Multi-AZ — HA không tách read workload.' },
  390: { A: 'Sticky session — không durable khi instance fail/scale.', C: 'Cognito user pool — không phải session store ecommerce.', E: 'SSM Application Manager — không lưu session transaction.' },
  393: { A: 'Kinesis Video Streams — không phải audio transcription pipeline.', B: 'Textract — document OCR, không audio call.', D: 'Amazon Connect — overkill cho files S3 có sẵn.' },
  394: { A: 'Magnetic — legacy, IOPS thấp.', B: 'Tăng gp3 IOPS max ~16k, không đủ 20k+.', D: 'Split volume — không tăng IOPS per database.' },
  396: { A: 'Shield Advanced đắt; WAF rate-based đủ cho nhiều case.', B: 'Shield EC2 — GA là entry point chính.', D: 'WAF on EC2 — traffic qua accelerator.' },
  397: { A: 'Lambda max 15 phút — job có thể 1 giờ.', B: 'API GW+Lambda — vẫn giới hạn 15 phút.', D: 'ECS EC2 — thêm ops quản worker nodes.' },
  398: { A: 'Multipart HTTPS — 100Mbps upload ~15TB/2 tuần, không đủ 600TB.', B: 'VPN — bandwidth không đủ timeline.', D: '10Gbps DX — đắt hơn Snowball cho one-time 600TB.' },
  402: { A: 'Retention period — không fix consumer throughput.', B: 'KPL — không fix shard capacity.', D: 'S3 Versioning — không liên quan Kinesis data loss.' },
  404: { A: 'Timeout 15 phút — không fix concurrency/throttling burst.', B: 'S3 replication — không buffer Lambda.', C: 'Thêm Lambda — không giải quyết sync invoke limits.' },
  408: { A: 'Route53 failover Lambda NLB — phức tạp hơn GA.', C: 'ALB — không hỗ trợ UDP native.', D: 'Route53 failover ALB — latency cao hơn GA.' },
  412: { A: 'GuardDuty+Lambda remediate — reactive, không prevent account-wide.', B: 'Trusted Advisor manual — không enforce.', C: 'RAM — không phải tool S3 public detection.' },
  417: { A: 'EC2 Savings Plan — không cover Lambda.', B: 'Lambda public subnet — không cần cho access private EC2.', D: 'Lambda default VPC — không reach private subnet EC2.' },
  421: { A: 'EBS SFTP — không serverless, không shared high IOPS dễ.', B: 'EFS SFTP — phức tạp hơn S3 backend.', D: 'VPC internal SFTP — không public trusted IPs.' },
  422: { A: 'NLB invoke Lambda — không async queue pattern.', B: 'ALB+ECS+SQS+App Mesh — over-engineered.', C: 'Lambda Auto Scaling vCPU — Lambda không scale vCPU theo queue.' },
  425: { A: 'gp2 — IOPS gắn capacity, không independent.', B: 'io2 — đắt hơn gp3 khi chỉ cần 15k IOPS.', D: 'io1 — legacy, gp3 rẻ hơn.' },
  429: { A: 'Deny sau Allow — MFA deny vẫn apply cho stop/terminate.', B: 'Deny all EC2 region unless MFA — sai logic policy.', C: 'Stop/terminate all regions MFA — policy scope us-east-1.' },
  436: { B: 'Multi-AZ — HA không tăng capacity workload.', C: 'Thêm instance — đề nói không thêm infrastructure.', D: 'On-Demand — không cost-effective sustained load.' },
  443: { A: 'S3 Transfer Acceleration — upload focus, không full app latency.', B: 'S3 CacheControl — không CDN edge compute.', D: 'ElastiCache — không giải upload/download GB global.' },
  449: { A: 'RDS Oracle — không support privileged third-party customizations.', C: 'EC2 Oracle — tự quản nhiều, không cost-effective.', D: 'Rewrite PostgreSQL — thay đổi app lớn.' },
  457: { A: 'DataSync — không AS2 protocol.', B: 'AppFlow — SaaS integration, không AS2 B2B.', D: 'Storage Gateway+Cognito — không AS2.' },
  470: { A: 'NAT gateway — IPv4 pattern; đề dùng IPv6.', B: 'Internet gateway — cho phép inbound initiation.', C: 'VGW — VPN/DX, không outbound-only IPv6.' },
  477: { A: 'Thiếu resource ARN object level cho DeleteObject.', C: 'Chỉ bucket ARN không đủ delete objects.', D: 'Deny statement không thay thế Allow DeleteObject.' },
  488: { A: 'Billing IAM group — không block root user member account.', B: 'Identity deny all — quá broad, không target billing.', D: 'Consolidated billing — không ẩn billing member.' },
  491: { B: 'FIFO — ordering không cần, đắt hơn standard.', C: 'FIFO+KMS — cost cao hơn standard queue.', D: 'SSE-KMS nhưng permission sai chỗ (function vs role).' },
  494: { A: 'EC2 không có resource-based policy.', B: 'Principal specified trong role trust.', C: 'Action có thể đủ nhưng IP condition block.' },
  509: { A: 'SG không hỗ trợ deny rules.', C: 'App tier — attack vào web tier public.', D: 'App tier NACL — traffic chưa tới app tier.' },
  514: { A: 'KMS/node role — không fix API server reachability.', C: 'Public subnet nodes — vi phạm security compliance.', D: 'Outbound SG — nodes cần reach private API endpoint.' },
  517: { B: 'CloudWatch agent — thêm ops, không native Session Manager logging.', C: 'SSM document daily — không real-time session logs.', D: 'CW subscription Firehose — phức tạp hơn S3 logging trực tiếp.' },
  531: { B: 'ALB trước Lambda — overhead cho webhook đơn giản.', C: 'SNS — third party gọi SNS không phải webhook pattern.', D: 'SQS — consumer pull, không HTTP webhook endpoint.' },
};

function buildExplanations(num, options, correct, meta) {
  const exp = {};
  const specific = SPECIFIC_WRONG[num] || {};
  for (const opt of options) {
    const k = opt.key;
    const en = (opt.text.en || '').replace(/\u0000/g, '').trim();
    if (correct.includes(k)) {
      exp[k] = correctVi(meta, k);
    } else {
      exp[k] = specific[k] || guessWrongVi(en);
    }
  }
  return exp;
}

function generateBatch(batchNum, startQ, endQ, exportFile) {
  const questions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'exports', exportFile), 'utf8'));
  const lines = [`/** Agent answers Q${startQ}–${endQ} — cursor-agent, no OpenAI API */`, 'module.exports = {'];

  for (const q of questions) {
    const num = q.number;
    const meta = { ...ANSWERS[num], n: num };
    if (!meta) throw new Error(`Missing answer metadata for Q${num}`);
    const correct = meta.a;
    const explanations = buildExplanations(num, q.options, correct, meta);

    lines.push(`  ${num}: {`);
    lines.push(`    correctAnswers: [${correct.map((x) => `'${x}'`).join(', ')}],`);
    lines.push(`    summaryNote:`);
    lines.push(`      '${meta.s.replace(/'/g, "\\'")}',`);
    lines.push(`    questionVi:`);
    lines.push(`      '${meta.q.replace(/'/g, "\\'")}',`);
    lines.push(`    explanations: {`);
    for (const [k, v] of Object.entries(explanations)) {
      lines.push(`      ${k}: '${v.replace(/'/g, "\\'")}',`);
    }
    lines.push(`    },`);
    lines.push(`  },`);
  }

  lines.push('};');
  lines.push('');
  const outPath = path.join(DATA_DIR, `agent-answers-batch${batchNum}.js`);
  fs.writeFileSync(outPath, lines.join('\n'));
  return { path: outPath, count: questions.length };
}

const batches = [
  [15, 387, 411, 'q387-411.json'],
  [16, 412, 436, 'q412-436.json'],
  [17, 437, 461, 'q437-461.json'],
  [18, 462, 486, 'q462-486.json'],
  [19, 487, 511, 'q487-511.json'],
  [20, 512, 536, 'q512-536.json'],
];

const results = batches.map(([n, s, e, f]) => generateBatch(n, s, e, f));
console.log(JSON.stringify(results, null, 2));
