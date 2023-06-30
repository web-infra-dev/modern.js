import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should throw error when exist syntax errors', async () => {
  await expect(
    build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      builderConfig: {
        source: {
          exclude: [path.resolve(__dirname, './src/test.js')],
        },
        security: {
          checkSyntax: true,
        },
        tools: {
          // @ts-expect-error
          rspack: config => {
            config.target = ['web'];
            config.builtins.presetEnv = undefined;
          },
        },
      },
    }),
  ).rejects.toThrowError('[Syntax Checker]');
});
