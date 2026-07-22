/**
 * Raw block parsed from PDF — chưa qua transform schema cuối.
 */

const OPTION_LINE = /^([A-F])[\.\)\:\-]\s*(.+)$/i;
const QUESTION_START = /^(?:Question\s+)?(\d{1,4})\s*[\.\):]\s*(.+)$/i;
const ANSWER_LINE = /^(?:Correct\s+)?Answer(?:s)?\s*[\:\-]?\s*(.+)$/i;
const TOPIC_QUESTION_MARKER = /Topic\s*(\d+)\s*Question\s*#\s*(\d+)/gi;

function splitTopicQuestionBlocks(text) {
  const markers = [...text.matchAll(TOPIC_QUESTION_MARKER)];
  if (markers.length === 0) return [];

  const blocks = [];

  for (let i = 0; i < markers.length; i++) {
    const match = markers[i];
    const topicNumber = Number(match[1]);
    const number = Number(match[2]);
    const start = match.index + match[0].length;
    const end = i + 1 < markers.length ? markers[i + 1].index : text.length;
    const body = text.slice(start, end).trim();

    blocks.push({
      number,
      topicNumber,
      lines: body.split('\n').map((l) => l.trim()).filter(Boolean),
    });
  }

  return blocks;
}

function splitGenericBlocks(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const qMatch = line.match(QUESTION_START);
    if (qMatch && !OPTION_LINE.test(line)) {
      if (current) blocks.push(current);
      current = {
        number: Number(qMatch[1]),
        topicNumber: 1,
        lines: [qMatch[2] || ''],
      };
      continue;
    }

    if (!current) {
      const loose = line.match(/^(\d{1,4})\s+([A-Z].+)/);
      if (loose) {
        current = { number: Number(loose[1]), topicNumber: 1, lines: [loose[2]] };
      }
      continue;
    }

    current.lines.push(line);
  }

  if (current) blocks.push(current);
  return blocks;
}

function splitIntoBlocks(text) {
  const topicBlocks = splitTopicQuestionBlocks(text);
  return topicBlocks.length > 0 ? topicBlocks : splitGenericBlocks(text);
}

function parseAnswerKeys(raw) {
  const keys = [];
  const upper = raw.toUpperCase();
  const andMatch = upper.match(/([A-F])\s*(?:,|AND|&|\s+)\s*([A-F])/);

  if (andMatch) {
    keys.push(andMatch[1], andMatch[2]);
  } else {
    for (const ch of upper) {
      if (/[A-F]/.test(ch) && !keys.includes(ch)) keys.push(ch);
    }
  }

  return keys.sort();
}

/**
 * Parse một block thành object thô (EN only từ PDF).
 */
function parseBlock(block) {
  const options = [];
  const stemLines = [];
  let correctAnswers = [];
  let chooseTwo = false;
  let currentOption = null;

  for (const line of block.lines) {
    const answerMatch = line.match(ANSWER_LINE);
    if (answerMatch) {
      if (currentOption) {
        options.push(currentOption);
        currentOption = null;
      }
      correctAnswers = parseAnswerKeys(answerMatch[1]);
      continue;
    }

    if (/choose\s+two/i.test(line)) chooseTwo = true;

    const optMatch = line.match(OPTION_LINE);
    if (optMatch) {
      if (currentOption) options.push(currentOption);
      currentOption = {
        key: optMatch[1].toUpperCase(),
        text: optMatch[2].trim(),
      };
      continue;
    }

    // Dòng tiếp theo của option (PDF xuống dòng giữa câu)
    if (currentOption) {
      currentOption.text = `${currentOption.text} ${line}`.replace(/\s+/g, ' ').trim();
      continue;
    }

    if (!/^Page\s+\d+/i.test(line) && !/^Exam\s+Dump/i.test(line)) {
      stemLines.push(line);
    }
  }

  if (currentOption) options.push(currentOption);

  const stemEn = stemLines.join(' ').replace(/\s+/g, ' ').trim();

  let importStatus = 'parsed';
  if (!stemEn || options.length < 2) {
    importStatus = 'needs_review';
  } else if (correctAnswers.length === 0) {
    importStatus = 'no_answer';
  }

  return {
    number: block.number,
    topicNumber: block.topicNumber || 1,
    stemEn,
    options,
    correctAnswers,
    questionType: chooseTwo || correctAnswers.length > 1 ? 'multiple' : 'single',
    importStatus,
  };
}

module.exports = {
  splitIntoBlocks,
  parseBlock,
  parseAnswerKeys,
};
