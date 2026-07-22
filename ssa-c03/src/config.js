require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3010,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ssa_c03',
  sourceFile:
    process.env.SOURCE_FILE ||
    '../AWS Certified Solutions Architect Associate SAA-C03.pdf',
  defaultSource: process.env.DEFAULT_SOURCE || 'topic-1/exam-a',
  importBatchSize: Number(process.env.IMPORT_BATCH_SIZE) || 25,

  /** AI enrich answers */
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  enrichBatchSize: Number(process.env.ENRICH_BATCH_SIZE) || 5,
  enrichDelayMs: Number(process.env.ENRICH_DELAY_MS) || 500,

  /** Optional: markdown tours with verified answers (q1–36) */
  markdownAnswersDir:
    process.env.MARKDOWN_ANSWERS_DIR || '../saa-c03-tours/topic-1/exam-a',
};
