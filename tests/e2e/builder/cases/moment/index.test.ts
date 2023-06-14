import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

webpackOnlyTest('removeMomentLocale false (default)', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { main: join(__dirname, './src/index.js') },
    builderConfig: {
      performance: {
        chunkSplit: {
          strategy: 'custom',
          splitChunks: {
            cacheGroups: {
              react: {
                test: /moment/,
                name: 'moment-js',
                chunks: 'all',
              },
            },
          },
        },
      },
    },
    runServer: false,
  });

  const files = await builder.unwrapOutputJSON(false);

  const fileName = Object.keys(files).find(
    file => file.includes('moment-js') && file.endsWith('.js.map'),
  );

  const momentMapFile = files[fileName!];

  expect(momentMapFile.includes('moment/locale')).toBeTruthy();
});

test.skip('removeMomentLocale true', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { main: join(__dirname, './src/index.js') },
    builderConfig: {
      performance: {
        removeMomentLocale: true,
        chunkSplit: {
          strategy: 'custom',
          splitChunks: {
            cacheGroups: {
              react: {
                test: /moment/,
                name: 'moment-js',
                chunks: 'all',
              },
            },
          },
        },
      },
    },
    runServer: false,
  });

  const files = await builder.unwrapOutputJSON(false);

  const fileName = Object.keys(files).find(
    file => file.includes('moment-js') && file.endsWith('.js.map'),
  );

  const momentMapFile = files[fileName!];

  expect(momentMapFile.includes('moment/locale')).toBeFalsy();
});
