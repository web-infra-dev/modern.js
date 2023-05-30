import { join } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { allProviderTest } from '@scripts/helper';

const fixtures = __dirname;

allProviderTest('removeMomentLocale false (default)', async () => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.js'),
    },
  };

  const builder = await build(
    buildOpts,
    {
      performance: {
        bundleAnalyze: {},
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
    false,
  );

  const files = await builder.unwrapOutputJSON(false);

  const fileName = Object.keys(files).find(
    file => file.includes('moment-js') && file.endsWith('.js.map'),
  );

  const momentMapFile = files[fileName!];

  expect(momentMapFile.includes('moment/locale')).toBeTruthy();
});

// allProviderTest('removeMomentLocale true', async () => {
//   const buildOpts = {
//     cwd: fixtures,
//     entry: {
//       main: join(fixtures, 'src/index.js'),
//     },
//   };

//   const builder = await build(
//     buildOpts,
//     {
//       performance: {
//         removeMomentLocale: true,
//         chunkSplit: {
//           strategy: 'custom',
//           splitChunks: {
//             cacheGroups: {
//               react: {
//                 test: /moment/,
//                 name: 'moment-js',
//                 chunks: 'all',
//               },
//             },
//           },
//         },
//       },
//     },
//     false,
//   );

//   const files = await builder.unwrapOutputJSON(false);

//   const fileName = Object.keys(files).find(
//     file => file.includes('moment-js') && file.endsWith('.js.map'),
//   );

//   const momentMapFile = files[fileName!];

//   expect(momentMapFile.includes('moment/locale')).toBeFalsy();
// });
