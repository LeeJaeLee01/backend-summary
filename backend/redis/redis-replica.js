import Redis from 'ioredis';

const redisReplica = new Redis({
  host: 'localhost',
  port: 6380,
  name: 'redis-replica',
  role: 'slave', // optional, informative
});

export default redisReplica;
