import type { Container } from '@modern-js/types/server';

const DEFAULT_CACHE_TTL = 600; // 10 min

export const createCacheContainer = (c: Cache) => {
  const container: Container = {
    async get(key) {
      try {
        const res = await c.match(key);
        if (!res) {
          return undefined;
        }
        return res.text();
      } catch (e) {
        return undefined;
      }
    },
    async set(key, value, options) {
      const resp = new Response(value);
      resp.headers.set(
        'cache-control',
        `max-age=${options?.ttl ? Math.round(options.ttl / 1000) : DEFAULT_CACHE_TTL}`,
      );
      await c.put(key, resp);
      return container;
    },
    delete(key) {
      return c.delete(key);
    },
    async has(key) {
      return (await container.get(key)) !== undefined;
    },
  };
  return container;
};
