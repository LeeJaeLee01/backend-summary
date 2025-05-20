import redisMaster from './redis-master.js';
import redisReplica from './redis-replica.js';

let useReplica = false;

const getRedisClient = async () => {
  if (!useReplica) {
    try {
      await redisMaster.ping();
      return redisMaster;
    } catch (e) {
      console.error('[Redis] Master unreachable. Switching to replica.');
      useReplica = true;
    }
  }

  try {
    await redisReplica.ping();
    return redisReplica;
  } catch (e) {
    throw new Error('[Redis] Both master and replica are unreachable');
  }
};

setInterval(async () => {
  if (useReplica) {
    try {
      await redisMaster.ping();
      console.log('[Redis] Master is back. Switching to master.');
      useReplica = false;
    } catch (e) {
      // still down, continue with replica
    }
  }
}, 5000);

const safeSet = async (key, value) => {
  const client = await getRedisClient();
  return client.set(key, value);
};

const safeGet = async (key) => {
  const client = await getRedisClient();
  return client.get(key);
};

export { safeGet, safeSet };
