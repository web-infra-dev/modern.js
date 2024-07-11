import { hc } from 'hono/client';
import type { AppType } from '@/service-worker';

export interface ModifyHeaderRule {
  id: string;
  test?: string;
  key: string;
  value: string;
}

export const SERVICE_SCRIPT = '/sw-devtools.js';

export const swClient = hc<AppType>('https://__devtools-api.modernjs.dev');

export const registerService = async () => {
  const reg = await navigator.serviceWorker.register(
    `${SERVICE_SCRIPT}?v=${Date.now()}`,
  );
  reg.addEventListener('updatefound', () => {
    const sw = reg.installing;
    sw?.addEventListener('statechange', () => {
      console.log('sw.state: ', sw.state);
    });
  });
  await navigator.serviceWorker.ready;
  return reg;
};
