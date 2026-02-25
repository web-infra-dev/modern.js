import fs from 'fs';
import os from 'os';
import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import type { BundleLoaderStrategy } from '../../src/adapters/node';
import {
  getBundleLoaderStrategies,
  getServerManifest,
  registerBundleLoaderStrategy,
} from '../../src/adapters/node';

describe('resource bundle strategy fallback', () => {
  it('falls back to strategy when bundle require throws synchronously', async () => {
    const tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'modernjs-server-core-resource-'),
    );
    const bundleRelativePath = path.join('bundles', 'main.js');
    const bundleFilePath = path.join(tempDir, bundleRelativePath);
    await fs.promises.mkdir(path.dirname(bundleFilePath), { recursive: true });
    await fs.promises.writeFile(
      bundleFilePath,
      'throw new Error("sync boom");',
    );

    const routes = [
      {
        entryName: 'main',
        bundle: bundleRelativePath,
      },
    ] as unknown as ServerRoute[];

    const strategies =
      getBundleLoaderStrategies() as unknown as BundleLoaderStrategy[];
    const strategyCount = strategies.length;
    let strategyCalled = false;
    const strategyBundle = {
      requestHandler: Promise.resolve(() => new Response('strategy')),
    };

    try {
      registerBundleLoaderStrategy(async filepath => {
        if (filepath === bundleFilePath) {
          strategyCalled = true;
          return strategyBundle;
        }
        return undefined;
      });

      const manifest = await getServerManifest(tempDir, routes);
      expect(strategyCalled).toBe(true);
      expect(manifest.renderBundles?.main).toBe(strategyBundle);
    } finally {
      strategies.splice(strategyCount);
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });
});
