import { redisProvider } from "./redis.provider.js";

// Atomically replace a value only if the current value matches `expected`.
const COMPARE_AND_SET_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
  return 1
end
return 0
`;

class RedisService {
  private get client() {
    return redisProvider.getClient();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.client.set(key, value, {
        EX: ttlSeconds,
      });
      return;
    }

    await this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async delMany(keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }

    return this.client.del(keys);
  }

  async compareAndSet(
    key: string,
    expected: string,
    next: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.client.eval(COMPARE_AND_SET_SCRIPT, {
      keys: [key],
      arguments: [expected, next, String(ttlSeconds)],
    });

    return Number(result) === 1;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<any> {
    return this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }
}

export const redisService = new RedisService();