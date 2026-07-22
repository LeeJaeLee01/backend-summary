const path = require('path');
const { readSourceFile } = require('./fileReader');
const { splitIntoBlocks, parseBlock } = require('./questionParser');

/**
 * Đọc file một lần, sau đó yield từng câu theo index (read → parse từng block).
 */
class QuestionIterator {
  constructor(sourceFile) {
    this.sourceFile = path.resolve(sourceFile);
    this.blocks = [];
    this.index = 0;
    this.initialized = false;
    this.format = null;
    this.meta = null;
  }

  async init() {
    if (this.initialized) return;

    const payload = await readSourceFile(this.sourceFile);
    this.blocks = splitIntoBlocks(payload.text);
    this.format = payload.format;
    this.meta = payload.meta;
    this.initialized = true;
  }

  get total() {
    return this.blocks.length;
  }

  get position() {
    return this.index;
  }

  hasNext() {
    return this.index < this.blocks.length;
  }

  /**
   * Đọc + parse đúng 1 câu tiếp theo.
   */
  nextRaw() {
    if (!this.hasNext()) return null;
    const block = this.blocks[this.index];
    this.index += 1;
    return parseBlock(block);
  }

  /** Nhảy tới index (dùng khi resume import) */
  seek(index) {
    this.index = Math.max(0, Math.min(index, this.blocks.length));
  }
}

/** Cache iterator theo file path trong session */
const iterators = new Map();

async function getIterator(sourceFile) {
  const key = path.resolve(sourceFile);
  if (!iterators.has(key)) {
    const it = new QuestionIterator(sourceFile);
    await it.init();
    iterators.set(key, it);
  }
  return iterators.get(key);
}

function clearIterator(sourceFile) {
  if (sourceFile) {
    iterators.delete(path.resolve(sourceFile));
    return;
  }
  iterators.clear();
}

module.exports = {
  QuestionIterator,
  getIterator,
  clearIterator,
};
