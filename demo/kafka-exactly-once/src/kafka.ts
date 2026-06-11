import { Kafka, logLevel } from 'kafkajs';
import { config } from './config';

export function createKafka(clientId: string) {
  return new Kafka({
    clientId,
    brokers: config.brokers,
    logLevel: logLevel.INFO,
  });
}

export function createIdempotentProducer(kafka: Kafka) {
  return kafka.producer({
    idempotent: true,
    maxInFlightRequests: 5,
    retry: { retries: 5 },
  });
}

export function createTransactionalProducer(kafka: Kafka) {
  return kafka.producer({
    idempotent: true,
    transactionalId: config.transactionalId,
    maxInFlightRequests: 5,
    retry: { retries: 5 },
  });
}

export function createEosConsumer(kafka: Kafka) {
  return kafka.consumer({
    groupId: config.consumerGroup,
    // readUncommitted: false (default) = READ_COMMITTED — chỉ đọc txn đã commit
    readUncommitted: false,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });
}
