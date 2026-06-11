export const config = {
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094').split(','),
  topicIn: process.env.TOPIC_IN ?? 'orders-in',
  topicOut: process.env.TOPIC_OUT ?? 'orders-out',
  consumerGroup: process.env.CONSUMER_GROUP ?? 'eos-processor-group',
  transactionalId: process.env.TRANSACTIONAL_ID ?? 'eos-processor-txn-1',
};
