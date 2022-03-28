import path from 'path';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { esbuildPlugin } from '../src/plugins/esbuild';

describe.only('esbuild', () => {
  test('plugin', async () => {
    const appContext = {
      internalDirectory: path.resolve(
        process.cwd(),
        './node_modules/.modern-js',
      ),
    };

    const file = path.resolve(
      process.cwd(),
      './node_modules/.modern-js/index.js',
    );

    const plugin = esbuildPlugin(
      {} as NormalizedConfig,
      appContext as IAppContext,
    );

    const result = await (plugin as any).transform('', file);
    expect(result).toBeUndefined();
  });
});
