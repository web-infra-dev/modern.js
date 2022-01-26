import path from 'path';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { normalizeAlias } from '../src/plugins/alias';

describe('alias', () => {
  test('normalizeAlias', () => {
    const appContext = {
      srcDirectory: path.resolve(process.cwd(), './src'),
      sharedDirectory: path.resolve(process.cwd(), './shared'),
      internalDirectory: path.resolve(
        process.cwd(),
        './node_modules/.modern-js',
      ),
      internalDirAlias: '@_modern_js_internal',
      internalSrcAlias: '@_modern_js_src',
    };

    const config = { source: { alias: {} } };
    const result = normalizeAlias(
      config as NormalizedConfig,
      appContext as IAppContext,
      [],
    );

    expect(result).toEqual(
      expect.arrayContaining([
        {
          find: new RegExp(`^/?${appContext.internalDirAlias}/(.*)`),
          replacement: `${appContext.internalDirectory}/$1`,
        },
        {
          find: new RegExp(`^/?${appContext.internalSrcAlias}/(.*)`),
          replacement: `${appContext.srcDirectory}/$1`,
        },
      ]),
    );
  });
});
