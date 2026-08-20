import { createRedisConnection } from "../lib/redis";

// BullMQ requires its own dedicated ioredis connection (maxRetriesPerRequest: null),
// separate from the general-purpose `redis` client used for caching.
export const queueConnection = createRedisConnection();
