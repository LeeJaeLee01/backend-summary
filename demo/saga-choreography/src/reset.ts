import fs from 'node:fs';
import { config } from './config.js';

for (const file of [config.orderDb, config.inventoryDb, config.paymentDb]) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

console.log('✅ Removed JSON stores in data/');
