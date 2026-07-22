const fs = require('fs/promises');
const path = require('path');
const config = require('../config');
const { parseAnswerKeys } = require('./questionParser');

/**
 * Load verified answers from qN.md files (saa-c03-tours).
 * Returns Map<number, enrichmentPayload>
 */
async function loadMarkdownAnswers(dir = config.markdownAnswersDir) {
  const resolved = path.resolve(dir);
  const map = new Map();

  let files;
  try {
    files = (await fs.readdir(resolved)).filter((f) => /^q\d+\.md$/i.test(f));
  } catch {
    return map;
  }

  for (const file of files) {
    const number = Number(file.match(/^q(\d+)\.md$/i)[1]);
    const content = await fs.readFile(path.join(resolved, file), 'utf8');
    const parsed = parseMarkdownQuestion(content, number);
    if (parsed) map.set(number, parsed);
  }

  return map;
}

function parseMarkdownQuestion(content, number) {
  const titleMatch = content.match(/^#\s*Q\d+\s*[—–-]\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : `Question ${number}`;

  const enMatch = content.match(/\*\*EN:\*\*\s*(.+?)(?=\n\n\*\*VI:\*\*|\n\n---|\n\n## Options)/s);
  const viMatch = content.match(/\*\*VI:\*\*\s*(.+?)(?=\n\n---|\n\n## Options)/s);

  const answerMatch = content.match(/\*\*Đáp án:\s*([^*\n]+)/i);
  if (!answerMatch) return null;

  const correctAnswers = parseAnswerKeys(answerMatch[1].replace(/và/gi, ' and '));

  const noteMatch = content.match(/\*\*Note:\*\*\s*(.+?)(?=\n\n\||\n\n---|$)/s);
  const summaryNote = noteMatch ? noteMatch[1].trim() : '';

  const options = [];
  const optionBlocks = content.split(/^###\s+([A-F])\s*$/gm);
  for (let i = 1; i < optionBlocks.length; i += 2) {
    const key = optionBlocks[i].toUpperCase();
    const block = optionBlocks[i + 1] || '';
    const optEn = block.match(/\*\*EN:\*\*\s*(.+?)(?=\n\n\*\*VI:\*\*|\n\n###|$)/s);
    const optVi = block.match(/\*\*VI:\*\*\s*(.+?)(?=\n\n###|\n\n---|$)/s);

    let explanation = '';
    const tableRow = content.match(
      new RegExp(`\\|\\s*\\*\\*${key}[\\s✅]*\\*\\*\\s*\\|\\s*(.+?)\\|`, 'i'),
    );
    if (tableRow) explanation = tableRow[1].trim();

    options.push({
      key,
      text: {
        en: optEn ? optEn[1].replace(/\s+/g, ' ').trim() : '',
        vi: optVi ? optVi[1].replace(/\s+/g, ' ').trim() : '',
      },
      explanation,
    });
  }

  return {
    source: 'topic-1/exam-a',
    title,
    question: {
      en: enMatch ? enMatch[1].replace(/\s+/g, ' ').trim() : '',
      vi: viMatch ? viMatch[1].replace(/\s+/g, ' ').trim() : '',
    },
    options,
    correctAnswers,
    summaryNote,
    questionType: correctAnswers.length > 1 ? 'multiple' : 'single',
    importStatus: 'verified_markdown',
    enrichedBy: 'markdown',
  };
}

module.exports = { loadMarkdownAnswers, parseMarkdownQuestion };
