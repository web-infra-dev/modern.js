import path from 'node:path';
import { stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import type { MiddlewareHandler } from '@modern-js/server-runtime';
import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import { SERVICE_RUNTIME_PLUGINS_FILE } from '../servicePath';

/** Load only the private compiled artifact, never application TypeScript source. */
export function createServiceRuntimePluginLoader(
  distDirectory: string,
  filename?: string,
  waitForBuild?: () => Promise<void>,
) {
  if (!filename) return undefined;
  if (filename !== SERVICE_RUNTIME_PLUGINS_FILE)
    throw Error('Invalid Service runtime plugin artifact.');
  const entry = path.join(distDirectory, filename);
  const require = createRequire(entry);
  let installed: ModuleFederationRuntimePlugin[] | undefined;
  let previousStamp: string | undefined;
  return async () => {
    // Modern's dev completion hook does not await async taps. Await our build
    // at the request boundary before selecting a Snapshot from the new plugin.
    await waitForBuild?.();
    let stamp: string | undefined;
    if (waitForBuild) {
      const file = await stat(entry, { bigint: true });
      stamp = `${file.mtimeNs}:${file.ctimeNs}:${file.size}:${file.ino}`;
    }
    if (!installed || stamp !== previousStamp) {
      // Node caches real paths, which can differ from /tmp or symlinked roots.
      const resolved = require.resolve(entry);
      const directory = `${path.dirname(resolved)}${path.sep}`;
      for (const cached of Object.keys(require.cache)) {
        if (cached.startsWith(directory)) delete require.cache[cached];
      }
      const module = require(resolved);
      installed = (module.default || module)();
      previousStamp = stamp;
    }
    return installed!;
  };
}

// Public asset paths can be customized to '.'. Deny this private subtree before
// all static middleware, including encoded paths and assetPrefix deployments.
export const denyServiceRuntimePluginAccess: MiddlewareHandler = async (
  context,
  next,
) => {
  let pathname: string;
  try {
    pathname = decodeURIComponent(
      new URL(context.req.raw.url).pathname,
    ).replaceAll('\\', '/');
  } catch {
    return new Response('Invalid path', { status: 400 });
  }
  const normalized = path.posix.normalize(pathname).toLowerCase();
  if (`${normalized}/`.includes('/server/mf-service-runtime/'))
    return new Response('Not found', { status: 404 });
  return next();
};
