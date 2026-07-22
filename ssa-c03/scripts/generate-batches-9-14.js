#!/usr/bin/env node
/** Generate agent-answers-batch9.js through batch14.js (Q237–386) */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const ANSWERS = {
  237: { a: ['A'], s: 'Cross-account VPC EC2 access, no SPOF → **VPC peering** + routes + SG.', q: 'EC2 VPC-A truy cập EC2 VPC-B khác account — không SPOF, không lo bandwidth.' },
  238: { a: ['C'], s: 'EC2 cost threshold per account → **AWS Budgets** + SNS alert theo scope EC2.', q: 'Nhiều account engineer, notify khi EC2 vượt ngưỡng tháng — cost-effective nhất.' },
  239: { a: ['B'], s: 'Lambda HTTPS + IAM auth, ít ops → **Lambda Function URL** authentication AWS_IAM.', q: 'Microservice Lambda Go, HTTPS + IAM auth — deploy operationally efficient nhất.' },
  240: { a: ['B'], s: 'DX + data warehouse, giảm egress → host visualization **cùng Region** DW, query nội bộ AWS.', q: 'Data warehouse AWS + DX, query 50MB — LOWEST data transfer egress cost.' },
  241: { a: ['C'], s: 'PostgreSQL online multi-Region → **RDS PostgreSQL + cross-Region read replica**.', q: 'PostgreSQL student records — available online nhiều Region, ít ops nhất.' },
  242: { a: ['C'], s: 'Trả IP mọi healthy EC2 → **Route 53 multivalue routing** + health checks.', q: '7 EC2 web app — DNS trả IP tất cả healthy instances.' },
  243: { a: ['A'], s: 'S3 read-only, latency thấp on-prem file apps → **S3 File Gateway** on-premises.', q: 'Lab data S3, clinics on-prem file apps — minimum latency.' },
  244: { a: ['C'], s: 'CMS single EC2 HA + scale → **Aurora + read replica AZ khác + ASG multi-AZ + ALB**.', q: 'CMS web+DB một EC2 — highly available và scale.' },
  245: { a: ['D'], s: 'Dev/prod ALB+ASG — tiết kiệm dev → **giảm max capacity ASG dev**.', q: 'Dev + prod environment ALB+ASG — configure dev cost-effective nhất.' },
  246: { a: ['D'], s: 'ALB internet-facing, EC2 private không nhận traffic → **public subnets cho ALB**, route tới private.', q: 'ALB internet-facing, EC2 private subnets — traffic không tới instances.' },
  247: { a: ['C', 'E'], s: 'Trước RDS read replica (Choose two) → **hoàn tất long transactions** + **bật automated backups**.', q: 'RDS MySQL thêm read replica — actions trước khi implement (chọn 2).' },
  248: { a: ['D'], s: 'Analytics EC2 CPU 100% → **SQS buffer + ASG scale theo queue depth**.', q: 'EC2 analytics CPU 100%, cần scale theo user load.' },
  249: { a: ['D'], s: 'SMB shared storage fully managed → **Amazon FSx for Windows File Server**.', q: 'Media app SMB clients, fully managed shared storage.' },
  250: { a: ['D'], s: 'VPC Flow Logs 90 ngày hot rồi ít dùng → **S3 + lifecycle Standard-IA sau 90 ngày**.', q: 'VPC Flow Logs truy cập nhiều 90 ngày, sau đó intermittent.' },
  251: { a: ['B'], s: 'EC2 private subnet cần outbound internet → **NAT Gateway** public subnet.', q: 'EC2 private subnet download security updates từ vendor internet.' },
  252: { a: ['A'], s: 'Case files multi-EC2 concurrent + redundancy → **Amazon EFS**.', q: 'Client case files — simultaneous access nhiều EC2, built-in redundancy.' },
  253: { a: ['C'], s: 'Policy allow EC2 delete, deny CloudWatch Logs delete → **delete EC2** được.', q: 'IAM Policy1+2 attached group — cloud engineer action nào được phép?' },
  254: { a: ['B'], s: 'Least privilege SG giữa tiers → **SG reference bằng security group ID**.', q: 'Three-tier VPC — SG ingress/egress least privilege giữa tiers.' },
  255: { a: ['D'], s: 'Checkout duplicate orders → **SQS FIFO queue** + order number message group.', q: 'Ecommerce checkout timeout tạo duplicate orders — refactor prevent.' },
  256: { a: ['B', 'D'], s: 'S3 document review (Choose two) → **versioning** + **MFA Delete** chống xóa nhầm.', q: 'S3 document review — prevent accidental deletion, all versions (chọn 2).' },
  257: { a: ['A'], s: 'Auto Scaling events → S3 serverless → **CloudWatch metric stream → Firehose → S3**.', q: 'EC2 Auto Scaling events store S3, near-real-time dashboard, không ảnh hưởng launch.' },
  258: { a: ['D'], s: 'CSV→Parquet S3 hourly → **Glue ETL job** + Lambda trigger S3 PUT.', q: 'Hundreds CSV 1GB/hour S3 → Parquet — least operational overhead.' },
  259: { a: ['A'], s: 'RDS backup 2 năm daily → **AWS Backup vault + plan** expiration 2 years.', q: 'RDS retention daily backups minimum 2 years — consistent restorable.' },
  260: { a: ['D'], s: 'FSx Windows + on-prem AD access control → **join file system to Active Directory**.', q: 'FSx Windows SMB — on-prem AD groups restrict access sau migrate AWS.' },
  261: { a: ['A', 'C'], s: 'Device-based content (Choose two) → **CloudFront cache versions** + **Lambda@Edge User-Agent**.', q: 'Retail website global — different content theo device (chọn 2).' },
  262: { a: ['A'], s: 'ElastiCache VPC riêng → **VPC peering** + routes + SG inbound từ app SG.', q: 'Cache VPC + App VPC ElastiCache access — most cost-effective.' },
  263: { a: ['A', 'D'], s: 'Containers minimal ops (Choose two) → **ECS cluster** + **ECS Fargate service** ≥2 tasks.', q: 'Microservices containers AWS — minimal maintenance, no extra infra (chọn 2).' },
  264: { a: ['D'], s: 'Route53 trả unhealthy EC2 IP → **ALB + health check**, Route53 alias ALB.', q: 'Route53 10 EC2 timeout — unhealthy instance IPs in DNS.' },
  265: { a: ['C'], s: 'HA HTTPS edge secure → **ALB private subnets + CloudFront origin ALB**.', q: 'Web/app/DB tiers HA, HTTPS gần edge, most secure.' },
  266: { a: ['A'], s: 'Gaming global latency + health redirect → **AWS Global Accelerator + ALB endpoints**.', q: 'Gaming multi-Region ALB — monitor health redirect traffic low latency.' },
  267: { a: ['D'], s: '1M mobile users near-real-time Parquet → **Kinesis Firehose → S3** + **Kinesis Data Analytics**.', q: 'Mobile app 1M users, near-real-time analyze, Parquet, encrypt — least ops.' },
  268: { a: ['A'], s: 'Scoreboard DB read slow, minimal change → **ElastiCache** front database.', q: 'Gaming scores RDS MySQL read performance — minimal architecture change.' },
  269: { a: ['C'], s: 'Analyst read queries slow RDS → **read replica** cho reporting.', q: 'RDS web app chậm vì read-only SQL analysts — minimal changes.' },
  270: { a: ['A'], s: 'Encrypt before upload + in transit → **client-side encryption** upload S3.', q: 'Centralized S3 logs — encrypted at rest before upload và in transit.' },
  271: { a: ['C'], s: 'Batch 1AM predictable peak → **scheduled scaling** scale up trước job.', q: 'Nightly batch ASG chậm reach capacity 1AM — cost-effective scale.' },
  272: { a: ['B'], s: 'Dynamic site multi-language latency → **CloudFront + ALB**, cache Accept-Language.', q: 'Dynamic website us-west-1, global users multi-language — không multi-Region arch.' },
  273: { a: ['B'], s: 'DR Aurora lowest RTO → **Aurora global database warm standby**.', q: 'Ecommerce single Region DR — DB up-to-date DR Region, scale reduced capacity.' },
  274: { a: ['B'], s: 'DR RTO <4h, ít resource normal → **AMI cross-Region + CloudFormation** automate DR.', q: 'EC2 DR RTO <4h, fewest AWS resources during normal operations.' },
  275: { a: ['A'], s: 'Slow morning ASG scale → **scheduled action desired capacity** trước giờ làm.', q: 'ASG 2 overnight 20 work hours — slow morning, minimize cost.' },
  276: { a: ['A', 'D'], s: 'Oracle RDS storage + ASG scale (Choose two) → **RDS storage autoscaling** + **ASG CPU metric**.', q: 'Multi-tier Oracle RDS hết storage, ASG no metrics — auto scale (chọn 2).' },
  277: { a: ['D'], s: 'EFS video expensive → **S3 store** + **EBS temp** processing.', q: 'Video EFS Standard costly — most cost-effective storage.' },
  278: { a: ['B', 'E'], s: 'Employee hierarchy + PII alert (Choose two) → **DynamoDB hierarchies** + **Macie + EventBridge SNS**.', q: 'Employee hierarchical data, high traffic, email nếu có financial PII (chọn 2).' },
  279: { a: ['A'], s: 'DynamoDB backup monthly 6mo/7yr → **AWS Backup plan** lifecycle cold 6mo retain 7yr.', q: 'DynamoDB monthly backup 6 months available, 7 years retain.' },
  280: { a: ['B'], s: 'CloudFront logs analysis → **Athena SQL + QuickSight** visualize.', q: 'CloudFront S3 logs — advanced analysis và visualizations.' },
  281: { a: ['A'], s: 'PostgreSQL RPO <1s → **RDS Multi-AZ** synchronous replication.', q: 'RDS PostgreSQL RPO less than 1 second — compliance.' },
  282: { a: ['B'], s: 'EC2 private chỉ ALB inbound → **EC2 SG allow chỉ từ ALB SG**.', q: 'EC2 private ALB front — restrict inbound chỉ ALB, block other sources.' },
  283: { a: ['D'], s: 'Linux NFS + Windows SMB no code change → **FSx for NetApp ONTAP**.', q: 'Simulation NFS + visualization SMB — single storage, no code changes.' },
  284: { a: ['B'], s: 'AWS billed items by user → **Cost Explorer report** download.', q: 'Budget planning — AWS billed items listed by user cho department budgets.' },
  285: { a: ['B'], s: 'S3 static + contact form <100 visits → **API Gateway + Lambda + SES**.', q: 'Static S3 website thêm contact form dynamic — most cost-effective.' },
  286: { a: ['C'], s: 'CloudFront không reflect Git updates → **invalidate CloudFront cache**.', q: 'CloudFront+S3 static, CI/CD success nhưng website không update.' },
  287: { a: ['B'], s: 'Windows 3-tier SQL Server native features → **EC2 all tiers + FSx Windows** file share.', q: 'Windows app SQL Server native backups/DQS + file sharing between tiers.' },
  288: { a: ['C'], s: 'Linux shared file store no app change → **EFS mount** all web servers.', q: 'Linux web servers shared file store migrate AWS — no application changes.' },
  289: { a: ['B'], s: 'Lambda S3 read secure → **IAM execution role** policy read specific bucket.', q: 'Lambda read S3 same account — most secure manner.' },
  290: { a: ['C'], s: 'ASG cost savings no long commitment → **On-Demand + Spot mix**.', q: 'Web app ASG scale — optimize cost, no long-term commitment.' },
  291: { a: ['A', 'B'], s: 'CloudFront secure video no cookies/hardcoded URL (Choose two) → **signed cookies + signed URLs**.', q: 'Streaming video S3 CloudFront — secure, no cookies client, hardcoded URLs (chọn 2).' },
  292: { a: ['A', 'B'], s: 'Streaming transform SQL (Choose two) → **Kinesis+Analytics+Firehose+Athena** hoặc **MSK+Glue+Athena**.', q: 'Real-time streaming transform before S3, query SQL (chọn 2).' },
  293: { a: ['D'], s: 'On-prem backup EOL, local access → **Storage Gateway stored volume** iSCSI.', q: 'On-prem volume backup — maintain local access, secure transfer AWS.' },
  294: { a: ['B'], s: 'EC2 S3 no internet → **gateway VPC endpoint S3**.', q: 'EC2 access S3 — traffic must not traverse internet.' },
  295: { a: ['B'], s: 'PII strip trước 2/3 apps → **S3 Object Lambda** transform on read.', q: 'Terabytes customer data PII — one app needs PII, two không — least ops.' },
  296: { a: ['D'], s: 'VPC peering valid CIDR smallest → **10.0.1.0/24** không overlap 192.168.0.0/24.', q: 'VPC peering dev 192.168.0.0/24 — smallest valid CIDR new VPC.' },
  297: { a: ['B'], s: '5 EC2 scale cost + surge CPU → **ASG target tracking** CPU 50%, min 2 max 6.', q: '5 EC2 ALB CPU <10% usually surge 65% — auto scale cost-optimized.' },
  298: { a: ['C'], s: 'Single AZ → multi-AZ HA → **subnet/AZ + ASG multi-AZ + RDS Multi-AZ**.', q: 'Critical app single AZ fail review — second Availability Zone HA.' },
  299: { a: ['B'], s: '8TB sub-ms 6GBps hundreds EC2 → **FSx Lustre SSD** import/export S3.', q: '8TB data sub-millisecond latency 6GBps — hundreds Linux EC2 process.' },
  300: { a: ['C'], s: 'Legacy 24/7 DB growing cost-effective → **EC2 RI app + Aurora RI storage**.', q: 'Legacy app 24/7 on-prem migrate — database storage grows, cost-effective.' },
  301: { a: ['C'], s: '30TB Windows → FSx bandwidth control → **AWS DataSync** throttle.', q: '30TB on-prem Windows → FSx Windows 5 days, control bandwidth shared link.' },
  302: { a: ['A', 'C'], s: 'Mobile slow-motion video (Choose two) → **CloudFront CDN** + **Elastic Transcoder**.', q: 'Mobile slow-motion clips buffering — performance scalability (chọn 2).' },
  303: { a: ['D'], s: 'ECS Fargate scale cost → **Application Auto Scaling target tracking**.', q: 'ECS Fargate CPU/memory peak launch — reduce cost when utilization decreases.' },
  304: { a: ['A'], s: 'DR Region periodic NFS transfer → **AWS DataSync**.', q: 'Large NFS data transfer between Regions periodically — least ops.' },
  305: { a: ['C'], s: 'Gaming SMB fully managed → **FSx for Windows File Server**.', q: 'Gaming shared storage SMB clients — fully managed.' },
  306: { a: ['A'], s: 'In-memory DB latency + min transfer cost → **same AZ cluster placement group**.', q: 'In-memory DB latency-sensitive 100k txn/min — cost-effective network.' },
  307: { a: ['D'], s: 'iSCSI recent data local → **Volume Gateway cached volumes**.', q: 'On-prem iSCSI minimize scale — only recently accessed data local.' },
  308: { a: ['A', 'C'], s: 'Trusted Advisor RDS cost org (Choose two) → **account có RDS instances** + **RDS RI Optimization**.', q: 'Consolidated billing Trusted Advisor RDS cost reduction (chọn 2).' },
  309: { a: ['A'], s: 'S3 rarely accessed buckets → **S3 Storage Lens** access patterns.', q: 'Identify S3 buckets no longer/rarely accessed — least operational overhead.' },
  310: { a: ['B'], s: 'Large datasets global customers cost → **CloudFront + S3 origin + signed URLs**.', q: 'AI/ML datasets S3 us-east-1 global customers — reduce transfer cost.' },
  311: { a: ['C'], s: 'Insurance quotes by type 24h → **SNS topic + SQS queues + message filtering**.', q: 'Insurance quotes separated by type, 24h response, no loss — operational efficiency.' },
  312: { a: ['B'], s: 'EC2+EBS nightly backup cross-Region → **AWS Backup plan** EC2 instances resource.', q: 'Multi-EBS EC2 nightly backup recoverable different Region — most efficient.' },
  313: { a: ['C'], s: 'Mobile authorized content millions → **CloudFront signed URLs** stream.', q: 'Mobile app authorized users watch content millions users.' },
  314: { a: ['B'], s: 'MySQL infrequent access minimal downtime → **Aurora Serverless MySQL**.', q: 'On-prem MySQL infrequent global sales — minimal downtime, no instance lock-in.' },
  315: { a: ['D'], s: 'EC2 vulnerability scan reports → **Amazon Inspector** agent + Lambda reports.', q: 'Migrate EC2 — actively scan vulnerabilities, detailed findings report.' },
  316: { a: ['C'], s: 'EC2 poll SQS costly → **migrate script to Lambda**.', q: 'EC2 poll SQS process messages — reduce ops cost, scale messages.' },
  317: { a: ['A'], s: 'Legacy CSV → Redshift COTS → **Glue ETL scheduled** CSV to Redshift.', q: 'Legacy CSV S3, COTS SQL Redshift only — cannot change legacy output.' },
  318: { a: ['A', 'D'], s: 'Audit EC2/SG changes (Choose two) → **CloudTrail audit** + **AWS Config rules**.', q: 'Track audit EC2 provisioning và SG rule changes post-migration (chọn 2).' },
  319: { a: ['A'], s: 'Remove shared SSH keys → **SSM Session Manager** connect EC2.', q: 'Hundreds Linux EC2 shared SSH keys — secure access least admin overhead.' },
  320: { a: ['A'], s: 'JSON ingest 1MB/s near-real-time → **Kinesis Data Streams + Kinesis Data Analytics**.', q: 'EC2 ingest JSON up 1MB/s near-real-time query — scalable minimal data loss.' },
  321: { a: ['D'], s: 'Ensure all S3 uploads encrypted → **bucket policy deny PutObject** without SSE header.', q: 'Ensure all objects uploaded S3 bucket are encrypted.' },
  322: { a: ['C'], s: 'Async thumbnail upload notify → **SQS queue** decouple upload/thumbnail.', q: 'Mobile image upload thumbnail 60s — async dispatch faster user response.' },
  323: { a: ['B'], s: 'Badge reader HTTPS HA → **API Gateway HTTPS + Lambda + DynamoDB**.', q: 'Facility badge HTTPS messages — HA process, security team analyze.' },
  324: { a: ['C'], s: 'iSCSI hundreds TB DR immediate access → **Volume Gateway cached volume** iSCSI.', q: 'On-premises iSCSI DR — immediate access, least infrastructure change.' },
  325: { a: ['A'], s: 'Cognito JWT protected S3 → **Cognito identity pool assume IAM role** S3 access.', q: 'Cognito auth S3 protected content — users cannot access protected bucket.' },
  326: { a: ['A', 'B'], s: 'S3 multipart lifecycle cost (Choose two) → **Intelligent-Tiering 30d** + **cleanup incomplete multipart**.', q: 'S3 Standard multipart overwrite — optimize cost HA resiliency (chọn 2).' },
  327: { a: ['A'], s: 'Private EC2 outbound chỉ approved URLs → **Network Firewall domain allowlist**.', q: 'EC2 private sensitive data — chỉ approved third-party software repos internet.' },
  328: { a: ['D'], s: 'Ecommerce launch spike async → **CloudFront static + SQS queue** buffer orders.', q: 'Three-tier ecommerce product launch spike — process all requests.' },
  329: { a: ['D'], s: 'EC2 patch scan + report → **Inspector scan + Systems Manager Patch Manager**.', q: 'EC2 not patched regularly — scan fleet, patch schedule, patch status report.' },
  330: { a: ['A'], s: 'RDS encrypt at rest → **KMS key enable encryption** DB instances.', q: 'RDS DB instances data at rest encrypted.' },
  331: { a: ['A'], s: '20TB 30 days 15Mbps 70% max → **AWS Snowball** offline transfer.', q: '20TB migrate 30 days limited 15Mbps — meet deadline.' },
  332: { a: ['B'], s: 'Confidential files remote Windows → **FSx Windows + on-prem AD + Client VPN**.', q: 'On-prem Windows file server capacity — secure remote download authorized users.' },
  333: { a: ['C'], s: 'Monthly batch CPU 100% midnight → **scheduled scaling policy** monthly.', q: 'Financial batch 1st month midnight CPU 100% — handle workload avoid downtime.' },
  334: { a: ['A'], s: 'SFTP AD S3 no app change → **Transfer Family SFTP + AD auth**.', q: 'On-prem AD SFTP download S3 files — least ops, no application changes.' },
  335: { a: ['B'], s: 'Fast large EC2 from AMI → **EBS fast snapshot restore** provisioned AMI.', q: 'Sudden demand large EC2 from AMI — minimum initialization latency.' },
  336: { a: ['A'], s: 'Aurora credentials rotate 14 days → **Secrets Manager + KMS custom rotation 14 days**.', q: 'Aurora MySQL credentials encrypted rotate 14 days — least effort.' },
  337: { a: ['A'], s: 'RDS replica lag + stored procedures → **Aurora MySQL + Aurora Replicas + Auto Scaling**.', q: 'RDS 5 read replicas lag peak, stored procedures — reduce lag minimal code change.' },
  338: { a: ['D'], s: 'Aurora DR cost-effective → **Aurora global database** min 1 instance secondary Region.', q: 'High-volume SaaS Aurora DR replicate secondary Region cost-effective.' },
  339: { a: ['C'], s: 'Embedded DB credentials least code → **RDS credentials in Secrets Manager + rotation schedule**.', q: 'Custom app embedded RDS MySQL credentials — secure least programming effort.' },
  340: { a: ['A'], s: 'SQL injection ALB → **AWS WAF** web ACL gắn ALB.', q: 'Website Aurora backend — vulnerable SQL injection, resolve issue.' },
  341: { a: ['D'], s: 'Lake Formation column-level QuickSight → **Lake Formation blueprint ingest + Athena** QuickSight.', q: 'S3 data lake + Aurora operational data QuickSight column-level auth least ops.' },
  342: { a: ['B'], s: 'Weekly batch 30 min before → **scheduled scaling policy** weekly recurrence.', q: 'Weekly batch jobs ASG — provision 30 min before, automated least ops.' },
  343: { a: ['C'], s: 'MySQL EC2 DR multi-Region → **Aurora global database** primary + DR Region.', q: 'MySQL EC2 private subnet scheduled backup DR multi-Region least ops.' },
  344: { a: ['A'], s: 'SQS messages >256KB → **SQS Extended Client Library + S3** large payloads.', q: 'Java SQS parse messages up 50MB — fewest code changes.' },
  345: { a: ['A'], s: 'Serverless auth global <100 users → **Cognito + Lambda@Edge + CloudFront**.', q: 'Restrict web content serverless auth global scale low latency cost-effective.' },
  346: { a: ['D'], s: 'NAS SMB/NFS migrate S3 lifecycle → **S3 File Gateway** maintain workstation feel.', q: 'Aging NAS SMB/NFS — migrate S3 lifecycle, same look and feel clients.' },
  347: { a: ['A'], s: '3yr savings change family 6mo → **Compute Savings Plan** flexible.', q: 'Standardized EC2 family/sizes, maximize 3yr savings, change family 6 months.' },
  348: { a: ['B'], s: 'DynamoDB constant predictable → **provisioned mode** specify RCU/WCU.', q: 'Wearable data DynamoDB constant workload — stay at/below forecast budget.' },
  349: { a: ['B'], s: 'Encrypted Aurora snapshot cross-account share → **snapshot + KMS key policy** share account.', q: 'Aurora PostgreSQL CMK encrypted snapshot share acquiring company account.' },
  350: { a: ['A', 'C'], s: 'SQL Server HA + reports (Choose two) → **Multi-AZ** + **read replica** reports.', q: 'RDS SQL Server Single-AZ HA + improve report performance (chọn 2).' },
  351: { a: ['D'], s: 'Event-driven serverless workflow → **Step Functions state machine + Lambda**.', q: 'Event-driven distributed serverless workflow — minimize operational overhead.' },
  352: { a: ['B'], s: 'UDP game 8 Regions low latency → **Global Accelerator UDP listeners**.', q: 'Online multiplayer UDP 8 Regions — minimize latency packet loss.' },
  353: { a: ['B'], s: 'MySQL EC2 → managed HA cost → **RDS Multi-AZ gp2** 2000 IOPS capacity.', q: 'Self-managed MySQL EC2 single AZ 1000 IOPS — managed HA fault tolerant cost-effective.' },
  354: { a: ['B'], s: 'Lambda RDS connection timeout peak → **RDS Proxy**.', q: 'Serverless API Lambda RDS PostgreSQL connection timeouts peak traffic.' },
  355: { a: ['D'], s: 'CPU batch 64 vCPU 512GB 15 min → **AWS Batch on EC2**.', q: 'CPU intensive hourly batch 15 min on-prem 64 vCPU — least ops within 15 min.' },
  356: { a: ['B'], s: '75% rarely after 30 days same availability → **S3 Standard-IA lifecycle** after 30 days.', q: 'S3 Standard 75% rarely accessed after 30 days — minimize cost same availability.' },
  357: { a: ['A', 'D'], s: 'Windows scoreboard HA (Choose two) → **S3+CloudFront static** + **FSx Windows server code**.', q: 'EC2 Windows ALB scoreboard static+dynamic HA storage (chọn 2).' },
  358: { a: ['C'], s: 'Billions images resize CloudFront → **Lambda@Edge + image library**.', q: 'CloudFront billions S3 images dynamic resize format — least ops.' },
  359: { a: ['C'], s: 'PHI S3 encrypt transit+rest CMK → **SecureTransport + SSE-KMS** compliance team KMS.', q: 'Hospital patient records S3 PHI — encrypted transit/rest, compliance administers key.' },
  360: { a: ['B'], s: 'Private API Gateway VPC calls → **interface VPC endpoint** API Gateway.', q: 'Private API Gateway REST APIs same VPC communicate through VPC not internet.' },
  361: { a: ['C'], s: 'Gaming sub-ms + historical queries → **DynamoDB+DAX + export S3 Athena**.', q: 'Multiplayer gaming sub-millisecond read + one-time historical queries least ops.' },
  362: { a: ['B', 'E'], s: 'Payment order FIFO (Choose two) → **Kinesis partition key payment ID** + **SQS FIFO message group payment ID**.', q: 'Payment messages same payment ID must arrive order (chọn 2).' },
  363: { a: ['B'], s: 'Game events ordered concurrent services → **SNS FIFO topics**.', q: 'Game unique events leaderboard/matchmaking/auth concurrent ordered.' },
  364: { a: ['B', 'D'], s: 'SQS/SNS encrypt authorized (Choose two) → **SNS SSE-KMS CMK key policy** + **SQS SSE-KMS CMK TLS condition**.', q: 'Hospital SQS/SNS symptoms data encrypt rest/transit authorized only (chọn 2).' },
  365: { a: ['C'], s: 'Restore DB 5 min ago 30 days → **automated backups** PITR.', q: 'RDS accidental edit — restore state 5 minutes before change within 30 days.' },
  366: { a: ['D'], s: 'API premium subscription Cognito → **API usage plans + API keys** limit non-subscribers.', q: 'API Gateway Lambda DynamoDB Cognito — only subscription access premium content.' },
  367: { a: ['A'], s: 'UDP latency routing on-prem → **Global Accelerator + NLB** 3 Regions endpoints on-prem.', q: 'Route53 UDP latency on-prem endpoints — improve performance availability.' },
  368: { a: ['A'], s: 'IAM password complexity rotation → **account-level password policy**.', q: 'All new IAM users password complexity mandatory rotation periods.' },
  369: { a: ['A'], s: 'Mixed language scheduled tasks → **AWS Batch jobs + EventBridge schedule**.', q: 'EC2 multiple 1-hour scheduled tasks different languages — performance scalability.' },
  370: { a: ['C'], s: 'Private EC2 license server internet → **NAT Gateway public subnet** managed.', q: 'Three-tier public web private EC2 license server internet — managed minimal maintenance.' },
  371: { a: ['C', 'D'], s: 'EKS EBS CMK encrypt (Choose two) → **EBS encryption default CMK Region** + **IAM role KMS policy EKS**.', q: 'EKS managed node group EBS encrypt customer managed KMS least ops (chọn 2).' },
  372: { a: ['B'], s: 'Oracle GIS images high update → **S3 images + DynamoDB geographic code key**.', q: 'Oracle millions GIS images disaster updates — HA scalable cost-effective.' },
  373: { a: ['A'], s: 'IoT trillions S3 30d hot 1yr archive → **Intelligent-Tiering + lifecycle Deep Archive 1yr**.', q: 'IoT Firehose S3 trillions objects ML 30d/12mo access — cost-effective storage.' },
  374: { a: ['D'], s: '3 VPCs + on-prem latency sensitive → **Direct Connect + Transit Gateway** attach VPCs.', q: 'Three VPCs us-east-1 + on-prem latency-sensitive hundreds GB/day cost-effective.' },
  375: { a: ['A'], s: 'Order processing approvals distributed → **AWS Step Functions** orchestration.', q: 'Ecommerce serverless order processing manual approvals EC2/containers/on-prem.' },
  376: { a: ['A'], s: 'Serverless RDS connection rejections → **RDS Proxy** connection pooling.', q: 'RDS MySQL serverless apps random traffic connection rejection errors.' },
  377: { a: ['B'], s: 'Auto Scaling audit launch/terminate → **lifecycle hooks custom script** audit system.', q: 'EC2 Auto Scaling audit OS versions patching — report launch/terminate efficiently.' },
  378: { a: ['B'], s: 'UDP game Auto Scaling non-relational → **NLB + DynamoDB on-demand**.', q: 'Real-time multiplayer UDP Auto Scaling group non-relational scores scale.' },
  379: { a: ['B'], s: 'Lambda cold start API latency → **provisioned concurrency** Lambda.', q: 'API Gateway Lambda loads libraries RDS — lowest response latency fewest changes.' },
  380: { a: ['D'], s: 'Start/stop EC2 RDS off-hours → **Lambda + EventBridge schedule**.', q: 'EC2 RDS migrate AWS — auto start/stop outside business hours minimize cost.' },
  381: { a: ['B'], s: 'PostgreSQL metadata reports slow → **Aurora PostgreSQL + Aurora Replica** reports.', q: 'PostgreSQL document metadata S3 reports — speed up least application code change.' },
  382: { a: ['A'], s: 'NLB data in transit → **TLS listener NLB** server certificate.', q: 'Three-tier NLB sensor data — improve security data in transit.' },
  383: { a: ['A'], s: 'Socket/core licenses existing → **Dedicated Reserved Hosts** BYOL.', q: 'COTS app socket/core licensing existing licenses — most cost-effective EC2 pricing.' },
  384: { a: ['C'], s: 'POSIX shared multi-AZ infrequent after 30d → **EFS Standard + lifecycle IA**.', q: 'EC2 Linux multi-AZ shared POSIX storage frequent 30d then infrequent — cost-effective.' },
  385: { a: ['C'], s: 'SG least privilege HTTPS web → **web SG 443 from ALB SG**, MySQL from web SG.', q: 'New VPC two public two private web+MySQL HTTPS — least access required.' },
  386: { a: ['B'], s: 'Repeated identical DB queries slow → **ElastiCache** cache datasets.', q: 'Multi-tier RDS MySQL frequent identical dataset queries — improve backend performance.' },
};

function guessWrongVi(en) {
  const t = (en || '').toLowerCase();
  if (t.includes('root user')) return 'Root user — vi phạm least privilege và best practice bảo mật.';
  if (t.includes('administratoraccess') || t.includes('poweruser')) return 'Quyền IAM quá rộng — không đáp ứng least privilege.';
  if (t.includes('nat instance')) return 'NAT instance — thêm patch/ops so với NAT Gateway managed.';
  if (t.includes('nat gateway') && t.includes('private subnet') && t.includes('same subnet')) return 'NAT Gateway phải ở public subnet, không private subnet.';
  if (t.includes('snowmobile')) return 'Snowmobile — overkill, chi phí rất cao.';
  if (t.includes('interface endpoint') && t.includes('s3')) return 'S3 dùng gateway endpoint (free), không interface endpoint.';
  if (t.includes('gateway endpoint') && (t.includes('api gateway') || t.includes('dynamodb') && t.includes('sqs'))) return 'API Gateway/DynamoDB/SQS private access dùng interface endpoint, không gateway.';
  if (t.includes('read replica') && t.includes('multi-az') && t.includes('failover')) return 'Read replica — không thay Multi-AZ failover write.';
  if (t.includes('internet gateway') && t.includes('private subnet') && t.includes('route')) return 'IGW route trực tiếp private subnet — sai kiến trúc.';
  if (t.includes('on-demand') && t.includes('24 hours')) return 'On-Demand 24/7 — không cost-effective sustained workload.';
  if (t.includes('spot') && (t.includes('frontend') || t.includes('always'))) return 'Spot — interrupt risk cho tier cần chạy liên tục.';
  if (t.includes('lambda') && t.includes('15 minute')) return 'Lambda max 15 phút — không job dài hơn.';
  if (t.includes('cloudtrail') && t.includes('flow log')) return 'CloudTrail — không phải target VPC Flow Logs.';
  if (t.includes('elasticache') && t.includes('memcached') && t.includes('order')) return 'Memcached — không đảm bảo ordering như Kinesis partition/FIFO.';
  if (t.includes('standard topic') && t.includes('order')) return 'SNS standard — không guarantee order.';
  if (t.includes('guardduty') && t.includes('vulnerabilit')) return 'GuardDuty — threat detection, không scan software vulnerabilities.';
  if (t.includes('macie') && t.includes('ec2')) return 'Macie — S3 PII scan, không EC2 vulnerability scan.';
  if (t.includes('shield') && t.includes('vulnerabilit')) return 'Shield — DDoS protection, không vulnerability scanning.';
  if (t.includes('comprehend') && t.includes('transcrib')) return 'Comprehend — NLP text, không speech-to-text.';
  if (t.includes('sqs standard') && t.includes('fifo')) return 'SQS standard — không preserve message order per payment ID.';
  return 'Không đáp ứng đúng yêu cầu đề bài hoặc chi phí/ops/bảo mật kém hơn phương án đúng.';
}

const MULTI_EXPL = {
  247: { C: 'Hoàn tất long-running transactions trước khi tạo replica — tránh replication lag.', E: 'Bật automated backups (retention > 0) — prerequisite cho read replica.' },
  256: { B: 'S3 versioning — giữ mọi version, recover accidental overwrite/delete.', D: 'MFA Delete — bảo vệ version delete, đáp ứng prevent accidental deletion.' },
  261: { A: 'CloudFront cache multiple content versions theo device/URL.', C: 'Lambda@Edge User-Agent header — route/serve content phù hợp device.' },
  263: { A: 'ECS cluster — foundation cho container workloads.', D: 'ECS Fargate — serverless containers, không quản EC2 worker nodes.' },
  276: { A: 'RDS storage autoscaling — tự tăng storage khi Oracle instance đầy.', D: 'ASG target tracking CPU — scale EC2 tier theo traffic tăng.' },
  291: { A: 'Signed cookies — users hỗ trợ cookies, secure streaming.', B: 'Signed URLs — clients không cookies/hardcoded URLs vẫn access được.' },
  292: { A: 'Kinesis Streams + Analytics transform + Firehose S3 + Athena SQL.', B: 'MSK + Glue ETL S3 + Athena — managed Kafka streaming pipeline.' },
  302: { A: 'CloudFront CDN cache video — giảm latency buffering mobile.', C: 'Elastic Transcoder convert format phù hợp mobile playback.' },
  308: { A: 'Trusted Advisor checks chạy trong account có RDS instances.', C: 'RDS Reserved Instance Optimization — giảm cost On-Demand RDS 90 ngày.' },
  318: { A: 'CloudTrail — audit API calls EC2/SG changes.', D: 'AWS Config rules — compliance auditing resource configuration changes.' },
  326: { A: 'Intelligent-Tiering sau 30 ngày — cost-effective access pattern inconsistent.', B: 'Lifecycle cleanup incomplete multipart — tránh cost multipart abandoned.' },
  350: { A: 'Multi-AZ — high availability automatic failover.', C: 'Read replica — offload reporting queries khỏi primary.' },
  357: { A: 'S3 + CloudFront static files — HA edge cache.', D: 'FSx Windows shared server-side code — multi-EC2 HA Windows.' },
  362: { B: 'Kinesis partition key payment ID — ordered processing per payment stream.', E: 'SQS FIFO message group payment ID — strict order per payment.' },
  364: { B: 'SNS SSE-KMS CMK + key policy restrict authorized principals.', D: 'SQS SSE-KMS CMK + queue policy TLS + key policy authorized access.' },
  371: { C: 'EBS encryption by default Region + customer managed KMS key.', D: 'IAM role EKS/node KMS permissions encrypt EBS volumes at rest.' },
};

function correctVi(meta, key) {
  if (MULTI_EXPL[meta.n] && MULTI_EXPL[meta.n][key]) return `✅ ${MULTI_EXPL[meta.n][key]}`;
  const tail = meta.s.includes('→') ? meta.s.split('→').pop().trim().replace(/\*\*/g, '') : meta.s.replace(/\*\*/g, '');
  return `✅ ${tail} — giải pháp phù hợp SAA-C03.`;
}

function buildExplanations(num, options, correct, meta) {
  const exp = {};
  for (const opt of options) {
    const k = opt.key;
    const en = (opt.text.en || '').replace(/\u0000/g, '').trim();
    exp[k] = correct.includes(k) ? correctVi(meta, k) : guessWrongVi(en);
  }
  return exp;
}

function generateBatch(batchNum, startQ, endQ, exportFile) {
  const questions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'exports', exportFile), 'utf8'));
  const lines = [`/** Agent answers Q${startQ}–${endQ} — cursor-agent, no OpenAI API */`, 'module.exports = {'];

  for (const q of questions) {
    const num = q.number;
    const meta = { ...ANSWERS[num], n: num };
    if (!meta.a) throw new Error(`Missing answer metadata for Q${num}`);
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

module.exports = { ANSWERS, buildExplanations, generateBatch };

if (require.main === module) {
  const batches = [
    [9, 237, 261, 'q237-261.json'],
    [10, 262, 286, 'q262-286.json'],
    [11, 287, 311, 'q287-311.json'],
    [12, 312, 336, 'q312-336.json'],
    [13, 337, 361, 'q337-361.json'],
    [14, 362, 386, 'q362-386.json'],
  ];
  const results = batches.map(([n, s, e, f]) => generateBatch(n, s, e, f));
  console.log(JSON.stringify(results, null, 2));
}
