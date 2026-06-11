/**
 * Step 3: Đọc orders-out — kiểm tra không duplicate eventId
 */
import { createEosConsumer, createKafka } from './kafka';
import { config } from './config';

async function main() {
  const kafka = createKafka('eos-demo-verifier');
  const consumer = kafka.consumer({ groupId: `verify-${Date.now()}` });

  await consumer.connect();
  await consumer.subscribe({ topic: config.topicOut, fromBeginning: true });

  const seen = new Map<string, number>();
  let total = 0;

  await new Promise<void>((resolve) => {
    consumer
      .run({
        eachMessage: async ({ message }) => {
          if (!message.value) return;
          total++;
          const body = JSON.parse(message.value.toString()) as { eventId: string };
          seen.set(body.eventId, (seen.get(body.eventId) ?? 0) + 1);
          console.log(`  ${message.offset}: ${message.value.toString()}`);
        },
      })
      .then(() => {});

    setTimeout(async () => {
      await consumer.stop();
      await consumer.disconnect();
      resolve();
    }, 3000);
  });

  const duplicates = [...seen.entries()].filter(([, n]) => n > 1);

  console.log(`\n📊 Total messages: ${total}`);
  console.log(`📊 Unique eventIds: ${seen.size}`);

  if (duplicates.length === 0) {
    console.log('✅ No duplicate eventId in output topic');
  } else {
    console.log('❌ Duplicates found:');
    duplicates.forEach(([id, n]) => console.log(`   ${id}: ${n} times`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
