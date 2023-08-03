import { getLibuilderTest } from '@/toolkit';
import { babelPresetPlugin } from '@modern-js/libuild-plugin-babel-preset';

describe('fixture:plugin:babel-preset', function () {
  it('plugin:babel-preset:options:react', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main: './index.tsx',
        ts: '/index.ts?virtual',
      },
      plugins: [
        babelPresetPlugin({
          react: {},
        }),
      ],
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();
  });

  it('plugin:babel-preset:options:import', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main: './index.tsx',
        ts: '/index.ts?virtual',
      },
      plugins: [
        babelPresetPlugin({
          import: {
            libraryName: 'antd',
            style: false,
          },
        }),
      ],
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();
  });

  it('plugin:babel-preset:options:import-array', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main: './index.tsx',
        ts: '/index.ts?virtual',
      },
      plugins: [
        babelPresetPlugin({
          import: [
            {
              libraryName: 'antd',
              style: false,
            },
            {
              libraryName: 'antd',
              style: false,
            },
          ],
        }),
      ],
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();
  });
});
