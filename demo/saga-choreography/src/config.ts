import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  dataDir: path.join(__dirname, '..', 'data'),
  orderDb: path.join(__dirname, '..', 'data', 'order.json'),
  inventoryDb: path.join(__dirname, '..', 'data', 'inventory.json'),
  paymentDb: path.join(__dirname, '..', 'data', 'payment.json'),
  outboxPollMs: 80,
  eventPropagationWaitMs: 1500,
};
