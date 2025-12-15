import type { Container } from '@modern-js/types/server';

export const createCacheContainer = async (namespace: string) => {
  const c = await caches.open(namespace);
  const container: Container = {
    async get(key) {
      try {
        const res = await c.match(key);
        if (!res) {
          return undefined;
        }
        const ttl = Number(res.headers.get('x-expire-at'));
        if (!Number.isNaN(ttl) && ttl < Date.now()) {
          container.delete(key);
        }
        return res.text();
      } catch (e) {
        return undefined;
      }
    },
    async set(key, value, options) {
      const resp = new Response(value);
      if (options?.ttl) {
        const expireAt = Date.now() + options.ttl;
        resp.headers.set('x-expire-at', String(expireAt));
      }
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
