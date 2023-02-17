import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { builderPluginImageCompress } from '@modern-js/builder-plugin-image-compress';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

webpackOnlyTest(
  'should handle unknown modules with fallback rule',
  async () => {
    await expect(
      build({
        cwd: __dirname,
        entry: { index: path.resolve(__dirname, './src/index.js') },
        plugins: [builderPluginImageCompress()],
      }),
    ).rejects.toBeDefined();
  },
);
