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
  return new Promise<void>(resolve => {
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) throw new Error('No installing service worker');
      const handleStateChange = () => {
        if (sw.state === 'activated') {
          resolve();
          sw.removeEventListener('statechange', handleStateChange);
        }
      };
      sw.addEventListener('statechange', handleStateChange);
    });
  });
};
