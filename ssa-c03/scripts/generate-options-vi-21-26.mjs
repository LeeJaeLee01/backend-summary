#!/usr/bin/env node
/** Generate options-vi-batch21..26 with sentence-level VI prefixes */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function fixEn(s) {
  return (s || '')
    .replace(/\u0000/g, 'fi')
    .replace(/Con\u0000gure/gi, 'Configure')
    .replace(/con\u0000gure/gi, 'configure')
    .replace(/\u0000le/g, 'file')
    .replace(/tra\u0000c/g, 'traffic')
    .replace(/noti\u0000cation/g, 'notification')
    .replace(/e\u0000cient/g, 'efficient')
    .replace(/speci\u0000c/g, 'specific')
    .replace(/work\u0000ow/g, 'workflow')
    .replace(/certi\u0000cate/g, 'certificate')
    .replace(/o\u0000oad/g, 'offload')
    .replace(/o\u0000ce/g, 'office')
    .replace(/pre\u0000x/g, 'prefix')
    .replace(/a\u0000nity/g, 'affinity')
    .replace(/pro\u0000le/g, 'profile')
    .replace(/de\u0000ne/g, 'define')
    .replace(/De\u0000ne/g, 'Define')
    .replace(/modi\u0000ed/g, 'modified')
    .replace(/modi\u0000y/g, 'modify')
    .replace(/ \u0000nd/g, ' find')
    .replace(/\u0000lter/g, 'filter')
    .replace(/ \u0000eet/g, ' fleet')
    .replace(/tor restricted/g, 'for restricted')
    .replace(/made\./g, 'mode.')
    .replace(/SOL Server/g, 'SQL Server')
    .replace(/VPModify/g, 'VPC. Modify')
    .replace(/bled\./g, 'billed.')
    .replace(/Savings Pian/g, 'Savings Plan')
    .replace(/ \u0000nance/g, ' finance')
    .replace(/identi\u0000able/g, 'identifiable')
    .replace(/ \u0000eld/g, ' field')
    .replace(/tiles\./g, 'files.')
    .replace(/tor analysis/g, 'for analysis');
}

const VERB_START = [
  ['Configure ', 'Cấu hình '],
  ['Create ', 'Tạo '],
  ['Use ', 'Dùng '],
  ['Deploy ', 'Triển khai '],
  ['Migrate ', 'Di chuyển '],
  ['Enable ', 'Bật '],
  ['Set up ', 'Thiết lập '],
  ['Add ', 'Thêm '],
  ['Purchase ', 'Mua '],
  ['Increase ', 'Tăng '],
  ['Delete ', 'Xóa '],
  ['Turn on ', 'Bật '],
  ['Turn off ', 'Tắt '],
  ['Implement ', 'Triển khai '],
  ['Install ', 'Cài đặt '],
  ['Launch ', 'Khởi chạy '],
  ['Run ', 'Chạy '],
  ['Store ', 'Lưu trữ '],
  ['Attach ', 'Gắn '],
  ['Associate ', 'Liên kết '],
  ['Allow ', 'Cho phép '],
  ['Grant ', 'Cấp '],
  ['Select ', 'Chọn '],
  ['Invite ', 'Mời '],
  ['Provision ', 'Cấp phát '],
  ['Adjust ', 'Điều chỉnh '],
  ['Order ', 'Đặt '],
  ['Copy ', 'Sao chép '],
  ['Move ', 'Di chuyển '],
  ['Host ', 'Host '],
  ['Keep ', 'Giữ '],
  ['Have ', 'Yêu cầu '],
  ['Make ', 'Đặt '],
  ['Serve ', 'Phục vụ '],
  ['Direct ', 'Chuyển hướng '],
  ['Route ', 'Định tuyến '],
  ['Send ', 'Gửi '],
  ['Process ', 'Xử lý '],
  ['Monitor ', 'Giám sát '],
  ['Check ', 'Kiểm tra '],
  ['Review ', 'Xem xét '],
  ['Validate ', 'Xác thực '],
  ['Encrypt ', 'Mã hóa '],
  ['Restrict ', 'Hạn chế '],
  ['Update ', 'Cập nhật '],
  ['Modify ', 'Sửa '],
  ['Extend ', 'Mở rộng '],
  ['Integrate ', 'Tích hợp '],
  ['Import ', 'Import '],
  ['Export ', 'Export '],
  ['Download ', 'Tải xuống '],
  ['Upload ', 'Tải lên '],
  ['Promote ', 'Promote '],
  ['Replicate ', 'Replicate '],
  ['Restore ', 'Khôi phục '],
  ['Lock ', 'Khóa '],
  ['Mount ', 'Mount '],
  ['Convert ', 'Chuyển đổi '],
  ['Reduce ', 'Giảm '],
  ['Optimize ', 'Tối ưu '],
  ['Build ', 'Xây dựng '],
  ['Write ', 'Ghi '],
  ['Read ', 'Đọc '],
  ['Query ', 'Truy vấn '],
  ['Schedule ', 'Lên lịch '],
  ['Trigger ', 'Kích hoạt '],
  ['Invoke ', 'Gọi '],
  ['Apply ', 'Áp dụng '],
  ['Activate ', 'Kích hoạt '],
  ['Disable ', 'Tắt '],
  ['Deny ', 'Từ chối '],
  ['Require ', 'Yêu cầu '],
  ['Ensure ', 'Đảm bảo '],
  ['Identify ', 'Xác định '],
  ['Detect ', 'Phát hiện '],
  ['Report ', 'Báo cáo '],
  ['Notify ', 'Thông báo '],
  ['Register ', 'Đăng ký '],
  ['Connect ', 'Kết nối '],
  ['Link ', 'Liên kết '],
  ['Map ', 'Ánh xạ '],
  ['Tag ', 'Gắn tag '],
  ['Transition ', 'Chuyển tier '],
  ['Protect ', 'Bảo vệ '],
  ['Secure ', 'Bảo mật '],
  ['Filter ', 'Lọc '],
  ['Block ', 'Chặn '],
  ['Prevent ', 'Ngăn '],
  ['Enforce ', 'Ép buộc '],
  ['Automate ', 'Tự động hóa '],
  ['Setup ', 'Thiết lập '],
  ['Generate ', 'Tạo '],
  ['From ', 'Từ '],
  ['Point ', 'Trỏ '],
  ['After ', 'Sau khi '],
  ['Choose ', 'Chọn '],
  ['Conver ', 'Chuyển đổi '],
];

const SHORT = {
  'AWS Fargate': 'AWS Fargate',
  'AWS Lambda': 'AWS Lambda',
  'Amazon DynamoDB': 'Amazon DynamoDB',
  'Amazon EC2 Auto Scaling': 'Amazon EC2 Auto Scaling',
  'MySQL-compatible Amazon Aurora': 'Amazon Aurora tương thích MySQL',
  'Amazon S3 with Amazon CloudFront': 'Amazon S3 với Amazon CloudFront',
  'Amazon S3 Glacier with Amazon ElastiCache': 'Amazon S3 Glacier với Amazon ElastiCache',
  'Amazon Elastic Block Store (Amazon EBS) volumes with Amazon CloudFront':
    'Amazon EBS volumes với Amazon CloudFront',
  'AWS Storage Gateway with Amazon ElastiCache': 'AWS Storage Gateway với Amazon ElastiCache',
  'Private endpoint': 'Private endpoint',
  'Regional endpoint': 'Regional endpoint',
  'Interface VPC endpoint': 'Interface VPC endpoint',
  'Edge-optimized endpoint': 'Edge-optimized endpoint',
  'Instance store volume': 'Instance store volume',
  'Amazon ElastiCache for Memcached cluster': 'Amazon ElastiCache for Memcached cluster',
  'Provisioned IOPS SSD Amazon Elastic Block Store (Amazon EBS) volume':
    'Amazon EBS volume loại Provisioned IOPS SSD',
  'Throughput Optimized HDD Amazon Elastic Block Store (Amazon EBS) volume':
    'Amazon EBS volume loại Throughput Optimized HDD',
  'AWS DataSync with a VPC endpoint': 'AWS DataSync với VPC endpoint',
  'AWS Direct Connect': 'AWS Direct Connect',
  'AWS Snowball Edge Storage Optimized': 'AWS Snowball Edge Storage Optimized',
  'AWS Storage Gateway': 'AWS Storage Gateway',
};

function translateSentence(s) {
  let t = s.trim();
  if (!t) return t;
  t = t
    .replace(/^Migrate the /, 'Di chuyển ')
    .replace(/^Create the /, 'Tạo ')
    .replace(/^Use the /, 'Dùng ')
    .replace(/^Store the /, 'Lưu trữ ')
    .replace(/^Deploy the /, 'Triển khai ')
    .replace(/^Configure the /, 'Cấu hình ')
    .replace(/^Update the /, 'Cập nhật ')
    .replace(/^Set up the /, 'Thiết lập ')
    .replace(/^Add the /, 'Thêm ')
    .replace(/^Encrypt the /, 'Mã hóa ');
  for (const [from, to] of VERB_START) {
    if (t.startsWith(from)) return to + t.slice(from.length);
  }
  return t;
}

function translateOption(en) {
  const fixed = fixEn(en).trim();
  if (!fixed) return fixed;
  if (SHORT[fixed]) return SHORT[fixed];
  return fixed
    .split(/(?<=\.)\s+/)
    .map(translateSentence)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function loadJson(rangeFile) {
  return JSON.parse(
    fs.readFileSync(path.join(root, 'data/exports-vi', `q${rangeFile}.json`), 'utf8'),
  );
}

function writeBatch(batchNum, from, to, rangeFile) {
  const items = loadJson(rangeFile);
  const lines = [`/** Options VI Q${from}–${to} */`, 'module.exports = {'];
  for (const q of items) {
    lines.push(`  ${q.number}: {`);
    lines.push(`    questionVi: '${esc(q.question?.vi || '')}',`);
    lines.push('    optionsVi: {');
    for (const opt of q.options) {
      lines.push(`      ${opt.key}: '${esc(translateOption(opt.text?.en || ''))}',`);
    }
    lines.push('    },');
    lines.push('  },');
  }
  lines.push('};', '');
  const out = path.join(root, 'data', `options-vi-batch${batchNum}.js`);
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`Wrote ${out} (${items.length} questions)`);
}

for (const [n, from, to, range] of [
  [21, 537, 561, '537-561'],
  [22, 562, 586, '562-586'],
  [23, 587, 611, '587-611'],
  [24, 612, 636, '612-636'],
  [25, 637, 661, '637-661'],
  [26, 662, 684, '662-684'],
]) writeBatch(n, from, to, range);
