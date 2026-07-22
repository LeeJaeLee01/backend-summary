const config = require('../config');

const AWS_KEYWORDS = [
  ['S3 Transfer Acceleration', 'S3 Transfer Acceleration'],
  ['Snowball', 'Snowball data transfer'],
  ['Amazon Aurora', 'Aurora database'],
  ['Amazon RDS', 'RDS database'],
  ['AWS Lambda', 'Lambda serverless'],
  ['Amazon EC2', 'EC2 compute'],
  ['Amazon S3', 'Amazon S3 storage'],
  ['S3', 'Amazon S3'],
  ['CloudFront', 'CloudFront CDN'],
  ['VPC endpoint', 'VPC endpoint'],
  ['Secrets Manager', 'Secrets Manager'],
  ['Amazon Athena', 'Athena query'],
  ['Amazon SQS', 'SQS messaging'],
  ['Amazon SNS', 'SNS notifications'],
  ['Global Accelerator', 'Global Accelerator'],
  ['Network Firewall', 'Network Firewall'],
  ['Gateway Load Balancer', 'Gateway Load Balancer'],
];

/**
 * Tạo title ngắn từ stem EN (PDF không có title sẵn).
 */
function deriveTitle(stemEn, number) {
  if (!stemEn) return `Question ${number}`;

  if (/aggregat/i.test(stemEn) && /S3/i.test(stemEn)) {
    return 'Global data aggregation to S3';
  }

  for (const [pattern, title] of AWS_KEYWORDS) {
    if (stemEn.includes(pattern)) return title;
  }

  const beforePrompt = stemEn.split(
    /\b(Which solution|What should|How should|Which combination|Which set|Which action)\b/i,
  )[0];

  const sentences = beforePrompt.split(/(?<=[.!?])\s+/).filter(Boolean);
  const candidate = (sentences[sentences.length - 1] || beforePrompt).replace(/\.$/, '').trim();

  if (candidate.length >= 12 && candidate.length <= 90) {
    return candidate;
  }

  if (beforePrompt.length <= 90) {
    return beforePrompt.replace(/\.$/, '').trim();
  }

  return `Question ${number}`;
}

function sourceFromTopic(topicNumber) {
  return `topic-${topicNumber || 1}/exam-a`;
}

/**
 * Transform raw parsed block → document schema lưu MongoDB.
 *
 * {
 *   number, source, title,
 *   question: { en, vi },
 *   options: [{ key, text: { en, vi }, explanation }],
 *   correctAnswers, summaryNote
 * }
 */
function toQuestionDocument(raw, context = {}) {
  const topicNumber = raw.topicNumber || 1;
  const source = context.source || sourceFromTopic(topicNumber) || config.defaultSource;

  return {
    number: raw.number,
    source,
    title: deriveTitle(raw.stemEn, raw.number),
    question: {
      en: raw.stemEn || '',
      vi: raw.questionVi || '',
    },
    options: (raw.options || []).map((opt) => ({
      key: opt.key,
      text: {
        en: opt.text || '',
        vi: opt.textVi || '',
      },
      explanation: opt.explanation || '',
    })),
    correctAnswers: raw.correctAnswers || [],
    summaryNote: raw.summaryNote || '',
    questionType: raw.questionType || 'single',
    importStatus: raw.importStatus || 'draft',
    meta: {
      sourceFile: context.sourceFile || null,
      topicNumber,
    },
  };
}

module.exports = {
  deriveTitle,
  sourceFromTopic,
  toQuestionDocument,
};
