const fs = require('fs/promises');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

async function readSourceFile(filePath) {
  const resolved = path.resolve(filePath);
  const ext = path.extname(resolved).toLowerCase();

  if (ext === '.docx') {
    return readDocx(resolved);
  }
  if (ext === '.pdf') {
    return readPdf(resolved);
  }
  if (ext === '.txt') {
    const text = await fs.readFile(resolved, 'utf8');
    return { text, format: 'txt', meta: { path: resolved } };
  }

  throw new Error(`Unsupported file type: ${ext}. Use .docx, .pdf, or .txt`);
}

async function readDocx(filePath) {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return {
    text: normalizeText(result.value),
    format: 'docx',
    meta: {
      path: filePath,
      messages: result.messages,
    },
  };
}

async function readPdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const result = await pdfParse(buffer);
  const text = normalizeText(result.text || '');

  return {
    text,
    format: 'pdf',
    meta: {
      path: filePath,
      pages: result.numpages,
      info: result.info,
      textLength: text.length,
      likelyScanned: text.trim().length < 500,
    },
  };
}

function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { readSourceFile, readDocx, readPdf, normalizeText };
