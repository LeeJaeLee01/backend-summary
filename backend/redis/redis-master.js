import Redis from "ioredis";

const redisMaster = new Redis({
  host: 'localhost',
  port: 6379,
  name: 'redis-master',
});

export default redisMaster;
