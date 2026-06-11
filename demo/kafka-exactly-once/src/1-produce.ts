/**
 * Step 1: Idempotent producer gửi message vào orders-in
 * (chống duplicate khi producer retry — tầng 1 của Kafka EOS)
 */
import { createIdempotentProducer, createKafka } from './kafka';
import { config } from './config';

interface OrderEvent {
  eventId: string;
  orderId: string;
  amount: number;
}

async function main() {
  const count = Number(process.argv[2] ?? 5);
  const kafka = createKafka('eos-demo-producer');
  const producer = createIdempotentProducer(kafka);

  await producer.connect();

  const messages = Array.from({ length: count }, (_, i) => {
    const payload: OrderEvent = {
      eventId: `evt-${Date.now()}-${i}`,
      orderId: `ord-${i + 1}`,
      amount: (i + 1) * 100,
    };
    return {
      key: payload.orderId,
      value: JSON.stringify(payload),
    };
  });

  await producer.send({
    topic: config.topicIn,
    messages,
  });

  console.log(`✅ Produced ${count} message(s) to "${config.topicIn}"`);
  messages.forEach((m) => console.log('  ', m.value));

  await producer.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
