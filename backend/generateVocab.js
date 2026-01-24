import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Xử lý __dirname trong ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hàm tạo từ ngẫu nhiên
function generateWord(minLen = 3, maxLen = 10) {
  const length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let word = '';
  for (let i = 0; i < length; i++) {
    word += letters[Math.floor(Math.random() * letters.length)];
  }
  return word;
}

const filePath = path.join(__dirname, '1GB_vocab1.txt');
const targetSizeBytes = 1 * 1024 * 1024 * 1024; // 1GB
const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });

let totalWritten = 0;
function writeChunk() {
  let ok = true;
  while (totalWritten < targetSizeBytes && ok) {
    const words = Array.from({ length: 1000 }, () => generateWord());
    const chunk = words.join(',') + ',';
    const buffer = Buffer.from(chunk, 'utf8');
    totalWritten += buffer.length;
    ok = stream.write(buffer);
  }

  if (totalWritten >= targetSizeBytes) {
    stream.end(() => {
      console.log(`✅ File created: ${filePath}`);
    });
  } else {
    stream.once('drain', writeChunk);
  }
}

writeChunk();
