/**
 * Step 2: Transactional processor — Kafka EOS (read → transform → write + commit offset)
 */
import { EachBatchPayload, Transaction } from 'kafkajs';
import { config } from './config';
import { createEosConsumer, createKafka, createTransactionalProducer } from './kafka';

interface OrderEvent {
  eventId: string;
  orderId: string;
  amount: number;
}

interface EnrichedEvent extends OrderEvent {
  processedAt: string;
  status: 'enriched';
}

function transform(raw: OrderEvent): EnrichedEvent {
  return {
    ...raw,
    processedAt: new Date().toISOString(),
    status: 'enriched',
  };
}

async function processBatchInTransaction(
  transaction: Transaction,
  payload: EachBatchPayload,
) {
  const { batch, resolveOffset, heartbeat, isRunning, isStale } = payload;
  if (!batch.messages.length) return;

  const lastOffset = batch.messages[batch.messages.length - 1].offset;

  for (const message of batch.messages) {
    if (!isRunning() || isStale()) break;
    if (!message.value) continue;

    const input = JSON.parse(message.value.toString()) as OrderEvent;
    const output = transform(input);

    await transaction.send({
      topic: config.topicOut,
      messages: [
        {
          key: message.key ?? output.orderId,
          value: JSON.stringify(output),
          headers: { sourceEventId: Buffer.from(output.eventId) },
        },
      ],
    });

    await heartbeat();
  }

  await transaction.sendOffsets({
    consumerGroupId: config.consumerGroup,
    topics: [
      {
        topic: batch.topic,
        partitions: [
          {
            partition: batch.partition,
            offset: (Number(lastOffset) + 1).toString(),
          },
        ],
      },
    ],
  });

  await transaction.commit();
  resolveOffset(lastOffset);

  console.log(
    `✅ EOS batch: partition=${batch.partition} count=${batch.messages.length} lastOffset=${lastOffset}`,
  );
}

async function main() {
  const once = process.argv.includes('--once');
  const kafka = createKafka('eos-demo-processor');
  const producer = createTransactionalProducer(kafka);
  const consumer = createEosConsumer(kafka);

  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: config.topicIn, fromBeginning: true });

  console.log(`🔄 EOS processor (${once ? 'one-shot' : 'continuous'})`);
  console.log(`   IN:  ${config.topicIn}`);
  console.log(`   OUT: ${config.topicOut}`);
  console.log(`   transactional.id: ${config.transactionalId}`);
  console.log(`   isolation: READ_COMMITTED\n`);

  await consumer.run({
    autoCommit: false,
    eachBatchAutoResolve: false,
    eachBatch: async (payload) => {
      if (!payload.batch.messages.length) return;

      const transaction = await producer.transaction();
      try {
        await processBatchInTransaction(transaction, payload);
      } catch (err) {
        await transaction.abort();
        throw err;
      }

      if (once) {
        await consumer.stop();
      }
    },
  });

  if (once) {
    await consumer.disconnect();
    await producer.disconnect();
    console.log('Done (--once).');
  }
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
