import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

(process.env.INTERNAL_USE_RSPACK_TRANSFORM_LEGACY ? test.skip : test)(
  'should not compile specified file when source.exclude',
  async () => {
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
        },
      }),
    ).rejects.toThrowError('[Syntax Checker]');
  },
);
