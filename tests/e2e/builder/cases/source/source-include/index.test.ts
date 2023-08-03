import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

// TODO: needs builtin:swc-loader
webpackOnlyTest(
  'should not compile file which outside of project by default',
  async () => {
    await expect(
      build({
        cwd: __dirname,
        entry: { index: path.resolve(__dirname, './src/index.js') },
        builderConfig: {
          security: {
            checkSyntax: true,
          },
        },
      }),
    ).rejects.toThrowError('[Syntax Checker]');
  },
);

test('should compile specified file when source.include', async () => {
  await expect(
    build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      builderConfig: {
        source: {
          include: [path.resolve(__dirname, '../test.js')],
        },
        security: {
          checkSyntax: true,
        },
      },
    }),
  ).resolves.toBeDefined();
});
