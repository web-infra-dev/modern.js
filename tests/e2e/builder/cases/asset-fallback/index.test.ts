import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

webpackOnlyTest(
  'should handle unknown modules with fallback rule',
  async () => {
    const builder = await build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      builderConfig: {
        output: {
          enableAssetFallback: true,
        },
      },
    });
    const files = await builder.unwrapOutputJSON();

    const result = Object.keys(files).find(file => file.endsWith('.xxx'));

    expect(result).toBeTruthy();
    expect(/\/static\/media\/foo.\w+.xxx/.test(result!)).toBeTruthy();
  },
);
