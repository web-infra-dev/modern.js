import path from 'path';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { hmrPlugin } from '../src/plugins/hmr';

describe.only('hmr', () => {
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

    const plugin = hmrPlugin({} as NormalizedConfig, appContext as IAppContext);

    const result = await (plugin as any).transform('', file);
    expect(result).toBeNull();
  });
});
