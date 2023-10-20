import type { SetupClientOptions } from '@modern-js/devtools-kit';
import { mountDevTools } from '@modern-js/devtools-mount';
import { parseQuery } from 'ufo';

try {
  const opts = parseQuery(__resourceQuery);
  mountDevTools(opts as SetupClientOptions);
} catch (err: unknown) {
  const e = new Error('Failed to execute mount point of DevTools.');
  e.cause = err;
  console.error(e);
}
