/// <reference lib="webworker" />
import type { ModifyHeaderRule, ServiceStatus } from '@/utils/service-agent';

declare const self: ServiceWorkerGlobalScope;

const version = process.env.VERSION;
const rulesParam = new URL(location.href).searchParams.get('rules');
if (!version) {
  throw new Error('[Modern.js DevTools] failed to load version');
}
const rules: ModifyHeaderRule[] = rulesParam ? JSON.parse(rulesParam) : [];
const unregisterUrl = `http://${location.host}/__devtools/service/unregister`;

self.addEventListener('install', e => {
  console.log(
    '[Modern.js DevTools] service worker installed with rules:',
    JSON.stringify(rules, null, 2),
  );
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  console.log(
    `[Modern.js DevTools] service worker activated, click to unregister: ${unregisterUrl}`,
  );
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.host === location.host) {
    if (url.pathname === '/__devtools/service/status') {
      const body: ServiceStatus = {
        href: location.href,
        rules,
        version,
      };
      const resp = new Response(JSON.stringify(body, null, 2));
      e.respondWith(resp);
      return;
    }
    if (url.pathname === '/__devtools/service/unregister') {
      e.respondWith(
        Promise.resolve().then(async () => {
          const success = await self.registration.unregister();
          if (success) {
            rules.length = 0;
          }
          return new Response(null, { status: success ? 200 : 500 });
        }),
      );
      return;
    }
  }

  const headers: Record<string, string> = {};
  e.request.headers.forEach((v, k) => {
    headers[k] = v;
  });
  for (const { test, key, value } of rules) {
    if (test === undefined || test === e.request.url) {
      headers[key] = value;
    }
  }
  const request = new Request(e.request, { headers });
  e.respondWith(fetch(request));
});
