/// <reference lib="webworker" />
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { createStorage } from 'unstorage';
import indexedDbDriver from 'unstorage/drivers/indexedb';
import type { ModifyHeaderRule } from '@/utils/service-agent';

declare const self: ServiceWorkerGlobalScope;

export interface ServiceStatus {
  version: string;
  href: string;
  rules: ModifyHeaderRule[];
}

const version = process.env.VERSION;
if (!version) {
  throw new Error('[Modern.js DevTools] failed to load version');
}

const HOST = 'https://__devtools-api.modernjs.dev';
const unregisterUrl = `${HOST}/unregister`;

const storage = createStorage({
  driver: indexedDbDriver({
    dbName: 'modernjs_devtools',
    storeName: 'service_worker',
  }),
});

const getModifyHeaderRules = async () => {
  const rules = await storage.getItem<ModifyHeaderRule[]>('rules');
  return rules || [];
};

const app = new Hono();

const routes = app
  .get('/version', async c => c.json({ version }))
  .get('/location', async c => c.json({ href: self.location.href }))
  .get('/rules', async c => c.json({ rules: await getModifyHeaderRules() }))
  .put(
    '/rules',
    validator('json', json => {
      if (!Array.isArray(json.rules)) {
        throw new Error('rules should be an array');
      }
      return { rules: json.rules };
    }),
    async c => {
      const { rules } = c.req.valid('json');
      await storage.setItem('rules', rules);
      console.log(
        '[Modern.js DevTools] update header modifier rules by:',
        rules,
      );
      return c.json({ rules });
    },
  )
  .get('/status', async c =>
    c.json({
      version,
      href: self.location.href,
      rules: await getModifyHeaderRules(),
    } as ServiceStatus),
  )
  .post('/unregister', async c =>
    c.json({ success: await self.registration.unregister() }),
  );

export type AppType = typeof routes;

self.addEventListener('install', () => {
  console.log('[Modern.js DevTools] service worker installed.');
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log(
    `[Modern.js DevTools] service worker activated,`,
    `click to unregister: ${unregisterUrl}`,
  );
  e.waitUntil(self.clients.claim());
});

const withHeaderRules = async (request: Request) => {
  const rules = await getModifyHeaderRules();
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k] = v;
  });
  for (const { test, key, value } of rules) {
    if (test === undefined || test === request.url) {
      headers[key] = value;
    }
  }
  return new Request(request, { headers });
};

self.addEventListener('fetch', e => {
  const { url } = e.request;
  if (url.startsWith(`${HOST}/`) || url === HOST) {
    e.respondWith(app.fetch(e.request));
  } else {
    e.respondWith(withHeaderRules(e.request).then(fetch));
  }
});
