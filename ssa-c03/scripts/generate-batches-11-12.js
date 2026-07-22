#!/usr/bin/env node
/** Generate agent-answers-batch11.js and batch12.js */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const ANSWERS = {
  287: { a: ['B'], s: 'Windows SQL Server + share files giữa tiers → **EC2 all tiers + FSx for Windows File Server**.', q: 'Migrate Windows 3-tier (app/business/SQL Server), cần native backup/DQS và share file giữa tiers.' },
  288: { a: ['C'], s: 'Linux shared file store, không đổi app → **Amazon EFS** mount trên web servers.', q: 'Linux web servers cần shared file store, không thay đổi application.' },
  289: { a: ['B'], s: 'Lambda đọc S3 an toàn nhất → **IAM execution role** + policy least privilege bucket cụ thể.', q: 'Lambda cần read S3 cùng account — giải pháp bảo mật nhất.' },
  290: { a: ['C'], s: 'ASG web app tiết kiệm không cam kết dài hạn → **On-Demand + Spot** mix.', q: 'Web app ASG scale theo demand, tối ưu cost không long-term commitment.' },
  291: { a: ['A', 'B'], s: 'CloudFront secure video: client không cookie + URL cố định → **signed cookies** và **signed URLs** (Choose two).', q: 'CloudFront streaming S3, secure access; một số client không cookie, một số không đổi URL (chọn 2).' },
  292: { a: ['A', 'B'], s: 'Streaming transform trước S3 + SQL query → **Kinesis+Analytics+Firehose+Athena** hoặc **MSK+Glue+Athena** (Choose two).', q: 'Real-time streaming transform trước S3, query bằng SQL (chọn 2).' },
  293: { a: ['C'], s: 'Backup on-prem giữ local access → **Storage Gateway cached volume** mount local.', q: 'Thay backup on-prem, vẫn truy cập local, backup AWS tự động an toàn.' },
  294: { a: ['B'], s: 'EC2 → S3 không qua internet → **gateway VPC endpoint S3**.', q: 'EC2 access S3 bucket, traffic không traverse internet.' },
  295: { a: ['B'], s: 'PII chỉ 1/3 app cần → **S3 Object Lambda** transform on-the-fly, ít ops.', q: 'Terabytes customer data, 1 app cần PII, 2 app phải loại PII — least operational overhead.' },
  296: { a: ['D'], s: 'VPC peering không overlap 192.168.0.0/24 → **10.0.1.0/24** (CIDR hợp lệ nhỏ nhất trong đáp án).', q: 'VPC mới peer dev VPC 192.168.0.0/24 — SMALLEST valid CIDR không overlap.' },
  297: { a: ['B'], s: 'ALB + CPU thấp, surge 65% → **ASG target tracking CPU 50%** min 2 max 6.', q: '5 EC2 ALB, CPU <10% thường xuyên, surge 65% — auto scale cost-effective.' },
  298: { a: ['C'], s: 'HA thêm AZ thứ 2 → **subnet mỗi AZ + ASG multi-AZ + RDS Multi-AZ**.', q: 'EC2 ASG + RDS single AZ — redesign HA với AZ thứ hai.' },
  299: { a: ['B'], s: '8TB sub-ms latency 6GB/s parallel Linux → **FSx for Lustre SSD** + S3 import/export.', q: '8TB data, sub-millisecond, 6 GBps, hundreds EC2 Linux parallel process.' },
  300: { a: ['C'], s: 'App 24/7, DB storage tăng → **EC2 RI + Aurora RI** cost-effective.', q: 'Legacy app 24/7 migrate AWS, database storage tăng dần — most cost-effective.' },
  301: { a: ['C'], s: '30TB Windows → FSx, throttle bandwidth → **AWS DataSync**.', q: '30TB Windows file server → FSx, 1Gbps shared, kiểm soát bandwidth, 5 ngày.' },
  302: { a: ['A', 'C'], s: 'Mobile video raw lớn buffer → **CloudFront** + **Elastic Transcoder** (Choose two).', q: 'Slow-motion video S3 raw lớn, buffering mobile — max performance, min ops (chọn 2).' },
  303: { a: ['D'], s: 'ECS Fargate scale theo metric, giảm cost → **Application Auto Scaling target tracking**.', q: 'ECS Fargate CPU/memory monitoring, giảm cost khi utilization giảm.' },
  304: { a: ['A'], s: 'NFS cross-Region periodic → **AWS DataSync**.', q: 'DR Region, transfer NFS hai chiều định kỳ — least operational overhead.' },
  305: { a: ['C'], s: 'Gaming SMB shared storage managed → **Amazon FSx for Windows File Server**.', q: 'Gaming app SMB clients, fully managed shared storage.' },
  306: { a: ['A'], s: 'In-memory DB latency + high throughput, min data transfer cost → **cluster placement group cùng AZ**.', q: 'In-memory DB latency-sensitive, 100k+ tx/min, high network — cost-effective network.' },
  307: { a: ['D'], s: 'iSCSI on-prem, chỉ data gần đây local → **Volume Gateway cached volumes**.', q: 'Minimize scale iSCSI on-prem, chỉ recently accessed data local.' },
  308: { a: ['C', 'D'], s: 'RDS Oracle On-Demand 90 ngày giảm cost → **RI Optimization** + **Idle DB Instances** checks (Choose two).', q: 'Consolidated billing, RDS Oracle On-Demand 90 ngày — Trusted Advisor giảm cost (chọn 2).' },
  309: { a: ['A'], s: 'S3 rarely accessed buckets → **S3 Storage Lens** activity metrics.', q: 'Tối ưu S3 cost, tìm bucket không/rất ít access — least ops.' },
  310: { a: ['B'], s: 'Dataset lớn global customers → **CloudFront** + **signed URLs** giảm transfer cost.', q: 'Large AI/ML datasets S3 us-east-1, customers NA/EU — giảm transfer, giữ performance.' },
  311: { a: ['C'], s: 'Insurance quotes theo loại, không mất message → **SNS + SQS message filtering**.', q: 'Web insurance quotes tách theo type, 24h response, không lost, max ops efficiency.' },

  312: { a: ['B'], s: 'EC2 + EBS backup cross-Region → **AWS Backup plan** (EC2 instances) + copy Region.', q: 'Nhiều EC2 + EBS volumes, backup nightly, recoverable Region khác — most ops efficient.' },
  313: { a: ['C'], s: 'Mobile streaming authorized users → **CloudFront + signed URLs**.', q: 'Mobile app millions users, authorized streaming content.' },
  314: { a: ['B'], s: 'MySQL on-prem infrequent, minimal downtime, không chọn instance type → **Aurora Serverless MySQL**.', q: 'On-prem MySQL global sales, infrequent access, minimal downtime, không lock instance type.' },
  315: { a: ['D'], s: 'Scan vulnerability EC2 + report → **Amazon Inspector** agent + Lambda reports.', q: 'Migrate EC2, cần active vulnerability scan và report findings.' },
  316: { a: ['C'], s: 'EC2 poll SQS tốn ops → **Lambda** event-driven process queue.', q: 'EC2 script poll SQS — giảm ops, scale messages tăng.' },
  317: { a: ['A'], s: 'CSV S3 → Redshift cho COTS SQL → **Glue scheduled ETL**.', q: 'Legacy CSV S3, COTS query Redshift/S3, không đổi legacy — least ops.' },
  318: { a: ['A', 'D'], s: 'Audit EC2/SG changes → **CloudTrail** + **AWS Config** rules (Choose two).', q: 'Track/audit inventory và config changes EC2 oversized, SG rules (chọn 2).' },
  319: { a: ['A'], s: 'Bỏ shared SSH keys → **SSM Session Manager**.', q: 'Hundreds Linux EC2, remove shared SSH keys — secure access least admin overhead.' },
  320: { a: ['A'], s: 'JSON ingest 1MB/s near-real-time query → **Kinesis Data Streams + Kinesis Data Analytics**.', q: 'EC2 ingest JSON on-prem, reboot mất in-flight, data science near-real-time SQL query.' },
  321: { a: ['D'], s: 'Đảm bảo mọi S3 upload encrypted → bucket policy deny thiếu **x-amz-server-side-encryption**.', q: 'Ensure all objects uploaded S3 bucket are encrypted.' },
  322: { a: ['C'], s: 'Upload ảnh async thumbnail 60s → **SQS** queue, confirm ngay khi nhận.', q: 'Mobile upload image, thumbnail 60s, cần response nhanh confirm received — async dispatch.' },
  323: { a: ['B'], s: 'Badge reader HTTPS messages HA → **API Gateway + Lambda + DynamoDB**.', q: 'HTTPS sensor messages badge readers, HA, security team analyze.' },
  324: { a: ['C'], s: 'iSCSI hundreds TB DR, immediate local access → **Volume Gateway cached volume** + snapshots.', q: 'On-prem iSCSI file storage DR, hundreds TB, immediate access no latency — least change.' },
  325: { a: ['A'], s: 'Cognito JWT không access protected S3 → **Cognito identity pool IAM role** mapping.', q: 'S3 web app Cognito auth, protected S3 bucket — fix permissions JWT users.' },
  326: { a: ['A', 'B'], s: 'S3 hot 30 ngày rồi inconsistent access → **Intelligent-Tiering** + **cleanup incomplete multipart** (Choose two).', q: 'Image hosting multipart S3, frequent 30 ngày rồi inconsistent — optimize cost HA (chọn 2).' },
  327: { a: ['A'], s: 'Private EC2 chỉ approved software URLs → **Network Firewall domain allow list**.', q: 'EC2 private subnet chỉ access approved third-party repo URLs, block internet khác.' },
  328: { a: ['B'], s: 'Ecommerce spike product launch → **CloudFront static** + **ASG scale EC2 API**.', q: 'S3 website + ALB API EC2 async workers — handle sudden sales spike.' },
  329: { a: ['D'], s: 'Fleet EC2 scan + patch report → **Inspector** + **SSM Patch Manager**.', q: 'Large EC2 fleet security scan + regular patch + patch status report.' },
  330: { a: ['A'], s: 'RDS encrypt at rest → **KMS key + enable encryption** khi tạo DB.', q: 'RDS DB instances — encrypt data at rest.' },
  331: { a: ['A'], s: '20TB migrate 30 ngày, 15Mbps 70% max → **AWS Snowball**.', q: '20TB on-prem → AWS 30 ngày, bandwidth 15Mbps max 70% — không đủ qua network.' },
  332: { a: ['B'], s: 'Windows confidential files remote secure → **FSx Windows + AD + Client VPN**.', q: 'On-prem Windows file server full, remote secure download authorized users.' },
  333: { a: ['C'], s: 'Month-end batch CPU spike đầu tháng → **ASG scheduled scaling**.', q: 'ALB+ASG app, đầu tháng midnight financial batch CPU 100% — handle workload.' },
  334: { a: ['A'], s: 'SFTP + Active Directory download S3 → **Transfer Family SFTP** + AD auth.', q: 'On-prem AD, SFTP client download S3 — least ops, no app change.' },
  335: { a: ['B'], s: 'ASG provision large EC2 min init latency → **EBS fast snapshot restore** + AMI.', q: 'Sudden demand, large EC2 from AMI ASG — minimum initialization latency.' },
  336: { a: ['A'], s: 'Aurora credentials rotate 14 ngày → **Secrets Manager** + KMS + Aurora integration.', q: 'Aurora MySQL EC2 app, encrypt + rotate DB credentials 14 ngày — least effort.' },
};

const MULTI_EXPL = {
  291: { A: 'Signed cookies — user hỗ trợ cookie, URL không đổi.', B: 'Signed URLs — client không cookie hoặc hardcoded URL.' },
  292: { A: 'Kinesis Streams + Analytics + Firehose → S3; Athena SQL query.', B: 'MSK + Glue ETL → S3; Athena SQL query.' },
  302: { A: 'CloudFront CDN cache/deliver video gần user.', C: 'Elastic Transcoder convert format phù hợp mobile.' },
  308: { C: 'RDS Reserved Instance Optimization — On-Demand 90 ngày nên xem RI.', D: 'Idle DB Instances — phát hiện RDS không dùng tốn phí.' },
  318: { A: 'CloudTrail — audit API calls ai thay đổi resource.', D: 'AWS Config — track configuration compliance inventory changes.' },
  326: { A: 'Intelligent-Tiering — access pattern inconsistent sau 30 ngày.', B: 'Lifecycle cleanup incomplete multipart — giảm storage cost.' },
};

const SPECIFIC_WRONG = {
  287: { C: 'EFS — NFS Linux, không phù hợp Windows file sharing.', D: 'io2 EBS shared — không ideal Windows multi-instance POSIX/SMB share.' },
  288: { A: 'S3 — app expect file system mount, cần refactor.', B: 'CloudFront — CDN không shared file store.', D: 'EBS multi-attach — không share across nhiều instance Linux standard.' },
  289: { C: 'Hardcode keys trong code — anti-pattern bảo mật.', D: 'Read all S3 buckets — vi phạm least privilege.' },
  290: { A: 'Dedicated Instances — đắt, không cost optimize.', B: 'On-Demand only — bỏ lỡ Spot savings.', D: 'RI — long-term commitment, đề bài không muốn.' },
  293: { A: 'Snowball — migration one-time, không ongoing backup local access.', D: 'Stored volume — full copy on-prem, không cache tiering như cached.' },
  294: { A: 'Route 53 private hosted zone — không route S3 traffic.', C: 'NAT — traffic vẫn qua internet path.', D: 'Site-to-Site VPN S3 — S3 không VPN endpoint trực tiếp.' },
  295: { A: 'DynamoDB proxy — duplicate data 3 apps, ops cao.', C: '3 S3 buckets — duplicate ETL pipelines.', D: '3 DynamoDB tables — nhiều ops duplicate data.' },
  296: { A: '/32 — không valid VPC CIDR block size.', B: '192.168.0.0/24 — overlap dev VPC.', C: '192.168.1.0/32 — overlap và invalid size.' },
  297: { A: 'Lambda terminate manual — không auto scale up.', C: 'ASG không scaling policy — không scale on surge.', D: 'Manual SNS email scale — không automated.' },
  298: { A: 'DB connections mỗi network — không Multi-AZ RDS.', B: 'Subnet span 2 AZ invalid.', D: 'Single subnet — ASG không multi-AZ properly.' },
  299: { A: 'FSx ONTAP — không đạt 6GBps Lustre parallel.', C: 'Lustre HDD — throughput thấp hơn SSD.', D: 'ONTAP tiering NONE — không optimize performance.' },
  300: { A: 'Spot app 24/7 — interrupt risk.', B: 'RDS On-Demand DB — đắt sustained + growing storage.', D: 'OD EC2 — app 24/7 không tối ưu bằng RI.' },
  301: { A: 'Snowcone — quá nhỏ 30TB.', B: 'File Gateway — không migrate bulk FSx hiệu quả bằng DataSync.', D: 'Transfer Family — SFTP không Windows file server bulk.' },
  303: { A: 'EC2 scheduled scale — ECS Fargate không EC2 ASG.', B: 'Lambda scale ECS — sai service.', C: 'EC2 ASG scale ECS — Fargate không EC2 instances.' },
  305: { A: 'DataSync mount — không SMB gaming shared FS.', B: 'EC2 Windows file share — không fully managed.', D: 'S3 mount — không SMB semantics native.' },
  306: { B: 'Partition across AZ — tăng latency cross-AZ cho in-memory DB.', C: 'ASG network target — không giảm transfer như cluster same AZ.', D: 'Step scaling AZ — không optimize network placement.' },
  307: { A: 'File Gateway — NFS không iSCSI block.', B: 'Tape Gateway — backup tape không primary iSCSI.', C: 'Stored volumes — full data on-prem, không minimize scale.' },
  310: { A: 'Transfer Acceleration — tăng upload, không giảm global download cost như CDN.', C: 'Cross-Region Replication — tốn storage + transfer.', D: 'Streaming app rewrite — nhiều dev hơn CloudFront.' },
  311: { A: 'Kinesis streams — overkill, nhiều ops hơn SNS+SQS.', B: 'Lambda+SNS per type — nhiều functions maintain.', D: 'Firehose OpenSearch — analytics không quote routing.' },
  312: { A: 'Lambda custom snapshots — nhiều ops hơn AWS Backup.', C: 'Backup chỉ EBS volumes — thiếu EC2 instance configuration.', D: 'Copy snapshot AZ — không cross-Region recovery.' },
  313: { A: 'Public S3 + KMS stream — không secure authorized streaming.', B: 'IPsec VPN per user — không scale millions mobile.', D: 'Client VPN — không content delivery platform.' },
  314: { A: 'Aurora provisioned — phải chọn instance type.', C: 'Redshift Spectrum — analytics không OLTP sales.', D: 'RDS MySQL — phải chọn instance class.' },
  315: { A: 'Shield — DDoS không vulnerability scan.', B: 'Macie — PII S3 không EC2 CVE scan.', C: 'GuardDuty — threat detection không patch CVE scan.' },
  316: { A: 'Bigger EC2 — vẫn poll 24/7 cost.', B: 'EventBridge off instance — không process queue.', D: 'Run Command on-demand — không continuous poll.' },
  317: { B: 'Python cron EC2 — nhiều ops hơn Glue.', C: 'Lambda+DynamoDB — COTS cần Redshift SQL.', D: 'EMR weekly — cluster ops cao hơn Glue scheduled.' },
  319: { B: 'STS SSH keys — vẫn SSH key management.', C: 'Bastion shared SSH — vi phạm remove shared keys.', D: 'Cognito SSH Lambda — phức tạp hơn Session Manager.' },
  320: { B: 'Firehose→Redshift — batch hơn near-real-time analytics.', C: 'EC2 instance store — mất data reboot.', D: 'EBS+Redis subscribe — không SQL query pattern.' },
  321: { A: 's3:x-amz-acl — ACL không enforce SSE.', B: 'ACL private — không bắt buộc encryption.', C: 'SecureTransport — in-transit không at-rest encryption.' },
  322: { A: 'Lambda sync thumbnail — user chờ 60s.', B: 'Step Functions — orchestration nặng hơn SQS.', D: 'SNS hai subscription — không queue buffer workers.' },
  323: { A: 'EC2 HTTPS endpoint — HA kém, ops cao.', C: 'Route 53 → Lambda — không HTTP ingress pattern.', D: 'S3 VPC endpoint sensors — badge gửi HTTPS không S3 direct.' },
  324: { A: 'File Gateway NFS — đổi protocol từ iSCSI.', B: 'Tape gateway — không immediate file access.', D: 'Stored volume full copy — không minimize on-prem như cached.' },
  325: { B: 'S3 ACL — Cognito JWT cần IAM role mapping.', C: 'Eventually consistent — không phải root cause permission.', D: 'Custom attributes — thiếu IAM role cho S3 access.' },
  327: { B: 'WAF — không filter outbound URL domain từ private subnet.', C: 'SG outbound URLs — SG không filter by URL.', D: 'ALB outbound — ALB không outbound internet proxy.' },
  328: { A: 'CloudFront dynamic — API dynamic không cache tốt.', C: 'CloudFront dynamic + ElastiCache — không scale workers async.', D: 'SQS delay response — không process sales requests faster.' },
  329: { A: 'Macie — PII scan không CVE.', B: 'GuardDuty — không software vulnerability assessment.', C: 'Detective — investigation không patch management.' },
  330: { B: 'Secrets Manager — không encrypt RDS at rest.', C: 'ACM SSL — in-transit không at-rest encryption.', D: 'IAM cert — không RDS TLS at-rest.' },
  331: { B: 'DataSync 15Mbps — 20TB >> 30 ngày realistic.', C: 'VPN — cùng bandwidth limit.', D: 'Transfer Acceleration — vẫn bound by 15Mbps.' },
  332: { A: 'EC2 public file server — không secure scalable.', C: 'S3 signed URL — không Windows file share workflow.', D: 'Public S3 endpoint — không secure confidential files.' },
  333: { A: 'CloudFront — không fix CPU batch spike backend.', B: 'Simple scaling reactive — chậm hơn scheduled trước midnight.', D: 'ElastiCache — không giải batch CPU spike.' },
  334: { B: 'DMS — DB replication không SFTP file download.', C: 'DataSync — không SFTP protocol client.', D: 'EC2 SFTP — tự quản nhiều ops.' },
  335: { A: 'register-image manual — không min latency như fast snapshot restore.', C: 'DLM+Lambda — phức tạp hơn fast snapshot restore.', D: 'EventBridge Backup — không optimize AMI launch latency.' },
  336: { B: 'Parameter Store custom rotation — nhiều ops hơn Secrets Manager native.', C: 'EFS credentials file — anti-pattern.', D: 'S3 credentials file — app phải poll, nhiều ops.' },
};

function guessWrongVi(en) {
  const t = (en || '').toLowerCase();
  if (t.includes('root user')) return 'Root user — vi phạm least privilege.';
  if (t.includes('hardcode') || t.includes('access key') && t.includes('code')) return 'Hardcode credentials — anti-pattern bảo mật.';
  if (t.includes('nat gateway') || t.includes('nat instance')) return 'NAT — traffic qua internet, tốn phí hơn VPC endpoint.';
  if (t.includes('public') && t.includes('s3')) return 'S3 public — không đáp ứng secure access.';
  if (t.includes('inspector') && t.includes('s3')) return 'Inspector — scan EC2/container, không PII content S3.';
  if (t.includes('macie') && t.includes('ec2')) return 'Macie — PII trong S3, không vulnerability EC2.';
  if (t.includes('guardduty') && t.includes('vulnerabilit')) return 'GuardDuty — threat detection, không CVE scan.';
  if (t.includes('interface endpoint') && t.includes('s3')) return 'S3 dùng gateway endpoint, không interface.';
  return 'Không đáp ứng đúng yêu cầu đề bài hoặc chi phí/ops/bảo mật kém hơn phương án đúng.';
}

function correctVi(meta, key) {
  if (MULTI_EXPL[meta.n] && MULTI_EXPL[meta.n][key]) return `✅ ${MULTI_EXPL[meta.n][key]}`;
  const tail = meta.s.includes('→') ? meta.s.split('→').pop().trim().replace(/\*\*/g, '') : meta.s.replace(/\*\*/g, '');
  return `✅ ${tail} — giải pháp phù hợp SAA-C03.`;
}

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

const results = [
  generateBatch(11, 287, 311, 'q287-311.json'),
  generateBatch(12, 312, 336, 'q312-336.json'),
];
console.log(JSON.stringify(results, null, 2));
