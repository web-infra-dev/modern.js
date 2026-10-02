import { readFileSync } from 'node:fs';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';

/**
 * ESM loader hook that strips TypeScript types from `.ts` files imported at
 * runtime (e.g. `await import(mockFile)`), using Node's own type-stripper.
 *
 * Only registered on Node < 22.18 (see setup.ts), where Node does not yet strip
 * types on its own; on newer Node this file is never registered.
 */
export function load(url, context, nextLoad) {
  if (url.endsWith('.ts')) {
    const source = readFileSync(fileURLToPath(url), 'utf8');
    const code = Module.stripTypeScriptTypes(source, { mode: 'transform' });
    return { format: 'module', source: code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
