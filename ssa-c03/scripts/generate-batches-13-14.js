#!/usr/bin/env node
/** Generate agent-answers-batch13.js and batch14.js */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const ANSWERS = {
  337: { a: ['A'], s: 'RDS MySQL replica lag peak → **Aurora MySQL** + Aurora Replicas + Auto Scaling.', q: 'RDS MySQL 5 read replicas lag >1s khi peak, stored procedures — giảm lag, ít đổi code/ops.' },
  338: { a: ['D'], s: 'Aurora DR cross-Region cost-effective → **Aurora global database** + ≥1 instance Region phụ.', q: 'Aurora MySQL SaaS high-volume — DR replicate Region phụ, cost-effective nhất.' },
  339: { a: ['C'], s: 'Embedded DB credentials → **Secrets Manager** + rotation schedule RDS native.', q: 'App custom embedded creds RDS MySQL — bảo mật hơn, ít programming effort nhất.' },
  340: { a: ['A'], s: 'SQL injection trên ALB/Aurora → **AWS WAF** + web ACL trước ALB.', q: 'Website EC2+ALB+Aurora bị SQL injection — cách xử lý?' },
  341: { a: ['D'], s: 'Lake Formation column-level QuickSight → **blueprint ingest** + **Lake Formation** + Athena.', q: 'S3 data lake Lake Formation + Aurora MySQL, QuickSight column-level auth marketing team.' },
  342: { a: ['B'], s: 'Batch weekly predictable → **scheduled scaling** ASG 30 phút trước job.', q: 'EC2 ASG batch weekly, CPU baseline 60%, cần scale 30 phút trước — tự động, ít ops.' },
  343: { a: ['C'], s: 'MySQL EC2 multi-Region DR → **Aurora global database** primary + secondary Region.', q: 'MySQL trên EC2 private subnet, DR multi-Region — ít operational overhead.' },
  344: { a: ['A'], s: 'SQS message >256KB Java → **SQS Extended Client Library** + S3.', q: 'Java SQS parse message tối đa 50MB — ít thay đổi code nhất.' },
  345: { a: ['A'], s: 'Auth <100 users global serverless → **Cognito** + **Lambda@Edge** + **CloudFront**.', q: 'Web app serverless, auth <100 users, global, latency thấp — cost-effective.' },
  346: { a: ['D'], s: 'NAS SMB/NFS migrate S3 giữ UX → **Amazon S3 File Gateway**.', q: 'NAS SMB/NFS on-prem → S3 lifecycle, client workstations giữ look-and-feel.' },
  347: { a: ['A'], s: 'EC2 3 năm, đổi instance family 6 tháng → **Compute Savings Plan**.', q: 'EC2 chuẩn hóa instance family, maximize savings 3 năm, đổi size/family sau 6 tháng.' },
  348: { a: ['A'], s: 'DynamoDB workload constant predictable → **provisioned + Standard-IA + reserved capacity**.', q: 'DynamoDB wearable data workload ổn định — trong budget forecast.' },
  349: { a: ['B'], s: 'Share Aurora encrypted snapshot cross-account → **KMS key policy** + share snapshot.', q: 'Aurora PostgreSQL CMK encrypted — share backup account acquiring cùng Region.' },
  350: { a: ['A', 'C'], s: 'SQL Server HA + reporting → **Multi-AZ** + **read replica** cho reports (Choose two).', q: 'RDS SQL Server Single-AZ cần HA + reports làm chậm transactions (Choose two).' },
  351: { a: ['C'], s: 'Event-driven serverless workflow → **EventBridge** invoke **Lambda**.', q: 'Migrate app sang event-driven distributed serverless architecture.' },
  352: { a: ['B'], s: 'UDP game 8 Regions low latency → **Global Accelerator** UDP listeners.', q: 'Multi-player game UDP 8 Regions — minimize latency và packet loss.' },
  353: { a: ['B'], s: 'Self-managed MySQL EC2 → **RDS Multi-AZ gp2** managed HA cost-effective.', q: 'Three-tier MySQL EC2 io2 1TB, 1000 IOPS peak, cần managed HA rẻ hơn.' },
  354: { a: ['B'], s: 'Lambda+RDS connection timeout peak → **RDS Proxy**.', q: 'API GW+Lambda+RDS PostgreSQL connection timeout khi peak — ít đổi code.' },
  355: { a: ['D'], s: 'Batch CPU 64 vCPU 512GB hourly → **AWS Batch on EC2**.', q: 'Batch job hourly 15 phút, on-prem 64 vCPU 512GB — ít ops nhất.' },
  356: { a: ['B'], s: '75% data rarely accessed sau 30 ngày, vẫn immediate → **S3 Standard-IA** lifecycle.', q: 'S3 Standard, 75% ít truy cập sau 30 ngày — giữ HA/resiliency, giảm cost.' },
  357: { a: ['A', 'D'], s: 'Windows gaming scoreboard → **S3+CloudFront** static + **FSx Windows** code (Choose two).', q: 'EC2 Windows ALB scoreboard, HA storage static+dynamic server-side (Choose two).' },
  358: { a: ['C'], s: 'Billion images resize dynamic → **Lambda@Edge** + image library.', q: 'CloudFront+S3 billions images, resize/format dynamic — ít ops nhất.' },
  359: { a: ['C'], s: 'PHI S3 encrypt transit+rest CMK → **SecureTransport** + **SSE-KMS** compliance team.', q: 'Hospital PHI S3 — encrypt transit/rest, compliance team quản KMS key.' },
  360: { a: ['B'], s: 'Private API GW same VPC gọi nhau → **interface VPC endpoint**.', q: 'API Gateway private 2 REST APIs cùng VPC — gọi qua VPC không internet.' },
  361: { a: ['C'], s: 'Gaming sub-ms read + historical query → **DynamoDB+DAX** + export S3 **Athena**.', q: 'Multiplayer game sub-millisecond read + one-time query historical — ít ops.' },

  362: { a: ['B', 'E'], s: 'Payment message ordering → **Kinesis partition key** hoặc **SQS FIFO message group** (Choose two).', q: 'Payment processing messages cùng payment ID phải đúng thứ tự (Choose two).' },
  363: { a: ['B'], s: 'Fan-out concurrent + ordered events → **SNS FIFO topics**.', q: 'Game events tới leaderboard/matchmaking/auth concurrent, đảm bảo order.' },
  364: { a: ['B', 'D'], s: 'SQS+SNS encrypt CMK authorized → **SNS SSE-KMS** + **SQS SSE-KMS+TLS** (Choose two).', q: 'Hospital SQS+SNS symptoms app — encrypt rest/transit, authorized only (Choose two).' },
  365: { a: ['C'], s: 'RDS restore 5 phút trước mọi thay đổi 30 ngày → **automated backups PITR**.', q: 'RDS accidental edit — restore state 5 phút trước bất kỳ change trong 30 ngày.' },
  366: { a: ['D'], s: 'Cognito subscription premium API → **API usage plans + API keys**.', q: 'API GW+Lambda+DynamoDB+Cognito — chỉ subscriber access premium, ít ops.' },
  367: { a: ['A'], s: 'UDP on-prem latency routing → **Global Accelerator + NLB** tới on-prem endpoints.', q: 'Route 53 UDP latency routing on-prem US/Asia/Europe — improve performance/availability.' },
  368: { a: ['A'], s: 'IAM password complexity rotation → **account-level password policy**.', q: 'IAM user password complexity và mandatory rotation — solutions architect làm gì?' },
  369: { a: ['A'], s: 'EC2 scheduled heterogeneous batch jobs → **AWS Batch + EventBridge schedule**.', q: 'EC2 Linux nhiều task 1 giờ schedule, teams khác nhau — ít ops.' },
  370: { a: ['C'], s: 'Private EC2 outbound internet → **NAT gateway** public subnet.', q: 'Three-tier VPC private EC2 cần internet — NAT đúng chỗ.' },
  371: { a: ['C', 'D'], s: 'EKS EBS encrypt CMK → **default EBS encryption Region** + **IAM role KMS** (Choose two).', q: 'EKS managed node group EBS encrypt CMK — ít ops (Choose two).' },
  372: { a: ['D'], s: 'Oracle GIS images lớn → **S3 images** + **Oracle RDS** metadata URLs.', q: 'Oracle single table GIS images high-res — migrate AWS.' },
  373: { a: ['B'], s: 'Trillions S3 objects Firehose → **Intelligent-Tiering** + archive access tier.', q: 'IoT Kinesis Firehose trillions S3 objects — optimize storage cost.' },
  374: { a: ['D'], s: '3 VPCs + on-prem → **Direct Connect + Transit Gateway**.', q: '3 VPC us-east-1 communicate + on-premises data center.' },
  375: { a: ['A'], s: 'Ecommerce order manual approval → **Step Functions**.', q: 'Serverless order processing cần manual approvals trong workflow.' },
  376: { a: ['A'], s: 'Serverless RDS traffic spikes → **RDS Proxy**.', q: 'RDS MySQL serverless apps traffic random — failed connections.' },
  377: { a: ['D'], s: 'EC2 audit OS/patch data → **custom script on instance** gửi audit system.', q: 'Centralize EC2 OS versions/patching/software — ensure compliance reporting.' },
  378: { a: ['B'], s: 'UDP game ASG spikes → **NLB + DynamoDB on-demand**.', q: 'Real-time multiplayer UDP ASG, demand spikes daytime — scale.' },
  379: { a: ['B'], s: 'Lambda cold start libraries slow → **provisioned concurrency**.', q: 'API GW+Lambda+DB, Lambda load nhiều libraries chậm — giảm latency.' },
  380: { a: ['D'], s: 'Auto start/stop EC2+RDS schedule → **Lambda** start/stop resources.', q: 'Migrate on-prem, tự động start/stop EC2 và RDS instances.' },
  381: { a: ['B'], s: 'PostgreSQL metadata search + reports → **Aurora PostgreSQL + read replica**.', q: 'Three-tier PostgreSQL search metadata key terms + reporting queries.' },
  382: { a: ['A'], s: 'NLB encrypt in transit → **TLS listener** + server certificate on NLB.', q: 'Three-tier NLB sensor data — encrypt data in transit.' },
  383: { a: ['A'], s: 'COTS socket/core license → **Dedicated Reserved Hosts**.', q: 'COTS app sockets/cores license, predictable capacity, dedicated hardware.' },
  384: { a: ['C'], s: 'EC2 multi-AZ POSIX HA storage → **EFS Standard**.', q: 'EC2 Linux multi-AZ cần POSIX storage highly available.' },
  385: { a: ['A'], s: 'Three-tier VPC SG → web **443 public** + MySQL **3306 từ web SG**.', q: 'VPC 2 public/2 private web/2 private MySQL — SG design đúng.' },
  386: { a: ['B'], s: 'Backend dataset ít đổi → **ElastiCache** cache giảm RDS calls.', q: 'Ecommerce EC2 backend gọi RDS datasets ít thay đổi — giảm DB load.' },
};

const MULTI_EXPL = {
  350: { A: 'Multi-AZ — HA và automatic recovery cho SQL Server.', C: 'Read replica AZ khác — offload reporting khỏi primary.' },
  357: { A: 'S3 static files + CloudFront edge cache — HA scalable cho static.', D: 'FSx for Windows File Server share server-side code giữa EC2 Windows instances.' },
  362: { B: 'Kinesis partition key = payment ID — messages cùng key giữ thứ tự.', E: 'SQS FIFO message group = payment ID — strict ordering per payment.' },
  364: { B: 'SNS SSE-KMS customer managed key + key policy restrict principals.', D: 'SQS SSE-KMS + key policy + queue policy TLS — encrypt rest và transit.' },
  371: { C: 'Bật default EBS encryption Region với customer managed KMS key.', D: 'IAM role EKS/node group grant kms permissions cho CMK.' },
};

const SPECIFIC_WRONG = {
  337: { B: 'ElastiCache + Lambda thay stored procedures — đổi code/ops nhiều.', C: 'MySQL EC2 — tự quản replication, ops cao.', D: 'DynamoDB — migration lớn, stored procedures không migrate dễ.' },
  338: { A: 'Binlog replication manual — ops cao hơn Aurora global DB.', B: 'Global DB phải giữ instance secondary — remove sẽ mất DR.', C: 'DMS + remove instance — không có DB chạy ở Region phụ.' },
  339: { A: 'KMS — không lưu database credentials.', D: 'Parameter Store — rotation RDS native kém hơn Secrets Manager.' },
  340: { B: 'ALB fixed response — không block SQL injection.', C: 'Shield Advanced — không chuyên SQLi WAF rules.', D: 'Inspector — vulnerability scan, không block SQLi realtime.' },
  342: { A: 'Dynamic scaling reactive — không provision 30 phút trước.', C: 'Predictive — cần historical data, weekly pattern đơn giản hơn scheduled.', D: 'EventBridge 60% CPU — reactive, không đủ sớm 30 phút.' },
  343: { A: 'MySQL EC2 standby — tự quản replication cross-Region.', B: 'Multi-AZ + read replica — không multi-Region DR.', D: 'S3 backup restore — RTO cao, ops nặng.' },
  346: { A: 'Volume Gateway — block storage, không SMB/NFS file shares.', B: 'Tape Gateway — archive tape, không file share UX.', C: 'FSx File Gateway — Windows FSx, không phải generic NAS SMB/NFS.' },
  347: { B: 'EC2 Instance Savings Plan — lock instance family, không đổi family sau 6 tháng.', C: 'Zonal RI — lock AZ, kém linh hoạt.', D: 'Standard RI — lock instance type/family.' },
  348: { B: 'Provisioned không reserved — đắt hơn predictable workload.', C: 'On-demand — đắt cho constant workload.', D: 'On-demand + reserved — mâu thuẫn, on-demand không có RCU setting.' },
  353: { A: 'io2 Block Express — đắt hơn gp2 cho 1000-2000 IOPS.', C: 'S3 Intelligent-Tiering — không relational database.', D: 'EC2 active-passive — không fully managed HA.' },
  355: { A: 'Lambda max 10GB RAM — không đủ 512GB.', B: 'Fargate max 30GB — không đủ memory.', C: 'Lightsail — không phù hợp 64 vCPU HPC batch.' },
  356: { A: 'Glacier Deep Archive — không immediate access.', C: 'One Zone-IA — mất AZ resilience so với Standard-IA.', D: 'One Zone-IA ngay — mất multi-AZ durability ngay từ đầu.' },
  358: { A: 'EC2 image library — ops cao, không scale billions images.', B: 'CloudFront origin request policy — không resize images built-in.', D: 'Response headers policy — không transform image body.' },
  360: { A: 'X-API-Key — authentication, không fix VPC routing.', C: 'Gateway endpoint — S3/DynamoDB, không API Gateway.', D: 'SQS giữa APIs — phải đổi architecture nhiều.' },
  363: { A: 'EventBridge — không guarantee strict ordering.', C: 'SNS standard — không ordering.', D: 'SQS FIFO — point-to-point, không fan-out concurrent services.' },
  365: { A: 'Read replica — không point-in-time 5 phút trước arbitrary change.', B: 'Manual snapshots — không continuous PITR.', D: 'Multi-AZ — HA không restore historical state.' },
  366: { A: 'API caching/throttling — không phân biệt subscription.', B: 'WAF — không inspect Cognito subscription attribute.', C: 'DynamoDB IAM — không gate API premium content dễ.' },
  367: { B: 'ALB — không hỗ trợ UDP.', C: 'CloudFront — không proxy UDP on-prem endpoints.', D: 'ALB + CloudFront — UDP không support.' },
  370: { A: 'NAT instance public — ops patch/harden, NAT gateway managed hơn.', B: 'NAT instance private subnet — sai kiến trúc.', D: 'NAT gateway private subnet — phải ở public subnet.' },
  378: { A: 'Route53+Aurora Serverless — không UDP NLB pattern.', C: 'Aurora Global — overkill game session state.', D: 'ALB — không UDP.' },
  382: { B: 'Shield+WAF NLB — không encrypt NLB-to-client TLS thay cert.', C: 'ALB thay NLB — đề dùng NLB three-tier.', D: 'EBS encrypt — at-rest, không in-transit client-NLB.' },
  383: { B: 'On-Demand Hosts — không cam kết 3 năm savings.', C: 'Dedicated RI — không guarantee physical host isolation license.', D: 'Dedicated Instances — không đảm bảo cùng physical host socket license.' },
  384: { D: 'EFS One Zone — không multi-AZ HA.' },
  385: { B: 'NACL web 443 — SG đủ và stateful hơn cho instance-level.', C: 'Web SG chỉ từ LB — thiếu nếu LB không trong cùng SG reference pattern đề.', D: 'NACL LB source — SG preferred over NACL cho app tier.' },
};

function guessWrongVi(en) {
  const t = (en || '').toLowerCase();
  if (t.includes('root user')) return 'Root user — vi phạm least privilege.';
  if (t.includes('nat instance')) return 'NAT instance — thêm ops so với NAT gateway managed.';
  if (t.includes('on-demand') && t.includes('instance') && !t.includes('host')) return 'On-Demand 24/7 — không tối ưu chi phí sustained.';
  if (t.includes('lambda') && (t.includes('512') || t.includes('64 vcpu'))) return 'Lambda — giới hạn memory/timeout, không HPC batch lớn.';
  if (t.includes('glacier deep archive')) return 'Deep Archive — không immediate access.';
  if (t.includes('one zone')) return 'One Zone — mất AZ resilience.';
  if (t.includes('application load balancer') && t.includes('udp')) return 'ALB — không hỗ trợ UDP.';
  if (t.includes('inspector')) return 'Inspector — vulnerability assessment, không block attack realtime.';
  if (t.includes('comprehend')) return 'Comprehend — NLP text, không phải use case này.';
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
  generateBatch(13, 337, 361, 'q337-361.json'),
  generateBatch(14, 362, 386, 'q362-386.json'),
];
console.log(JSON.stringify(results, null, 2));
