/**
 * Chạy full demo: produce → đợi processor (chạy riêng terminal) hoặc one-shot process
 *
 * Usage:
 *   Terminal 1: npm run process
 *   Terminal 2: npm run demo
 */
import { spawn } from 'child_process';
import { config } from './config';

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

async function main() {
  console.log('=== Kafka Exactly-Once Demo ===\n');
  console.log(`Broker: ${config.brokers.join(',')}`);
  console.log(`Flow: ${config.topicIn} → [transactional processor] → ${config.topicOut}\n`);

  console.log('1) Producing 5 messages...');
  await run('npx', ['tsx', 'src/1-produce.ts', '5']);

  console.log('\n2) Waiting 8s — ensure "npm run process" is running in another terminal...');
  await new Promise((r) => setTimeout(r, 8000));

  console.log('\n3) Verifying output...');
  await run('npx', ['tsx', 'src/3-verify-output.ts']);

  console.log('\n✅ Demo finished. See README for EOS explanation.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
