import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { allProviderTest } from '@scripts/helper';
import { build } from '@scripts/shared';

allProviderTest('should throw error when exist syntax errors', async () => {
  await expect(
    build(
      {
        cwd: __dirname,
        entry: { index: path.resolve(__dirname, './src/index.js') },
      },
      {
        source: {
          exclude: [path.resolve(__dirname, './src/test.js')],
        },
        security: {
          checkSyntax: true,
        },
        tools: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          rspack: config => {
            config.target = ['web'];
            config.builtins.presetEnv = undefined;
          },
        },
      },
    ),
  ).rejects.toThrowError('[Syntax Checker]');
});
