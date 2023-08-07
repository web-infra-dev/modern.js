import assert from 'assert';
import * as path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';

const getIndexFile = async (builder: Awaited<ReturnType<typeof build>>) => {
  const files = await builder.unwrapOutputJSON();
  const [lodashBundle, content] =
    Object.entries(files).find(
      ([file]) => file.includes('index') && file.endsWith('.js'),
    ) || [];

  assert(lodashBundle);

  return {
    content: content!,
    size: content!.length / 1024,
  };
};

// TODO: needs builtin:swc-loader
webpackOnlyTest('should optimize lodash bundle size by default', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.ts'),
    },
    builderConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
    runServer: false,
  });

  const { content, size } = await getIndexFile(builder);
  expect(content.includes('debounce')).toBeFalsy();
  expect(size < 10).toBeTruthy();
});

webpackOnlyTest(
  'should optimize lodash bundle size when using SWC plugin',
  async () => {
    const builder = await build({
      cwd: __dirname,
      entry: {
        index: path.resolve(__dirname, './src/index.ts'),
      },
      builderConfig: {
        performance: {
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
      },
      plugins: [builderPluginSwc()],
      runServer: false,
    });

    const { content, size } = await getIndexFile(builder);
    expect(content.includes('debounce')).toBeFalsy();
    expect(size < 10).toBeTruthy();
  },
);

webpackOnlyTest(
  'should not optimize lodash bundle size when transformLodash is false',
  async () => {
    const builder = await build({
      cwd: __dirname,
      entry: {
        index: path.resolve(__dirname, './src/index.ts'),
      },
      builderConfig: {
        performance: {
          transformLodash: false,
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
      },
      runServer: false,
    });

    const { content, size } = await getIndexFile(builder);
    expect(content.includes('debounce')).toBeTruthy();
    expect(size > 30).toBeTruthy();
  },
);

webpackOnlyTest(
  'should not optimize lodash bundle size when transformLodash is false and using SWC plugin',
  async () => {
    const builder = await build({
      cwd: __dirname,
      entry: {
        index: path.resolve(__dirname, './src/index.ts'),
      },
      builderConfig: {
        performance: {
          transformLodash: false,
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
      },
      plugins: [builderPluginSwc()],
      runServer: false,
    });

    const { content, size } = await getIndexFile(builder);
    expect(content.includes('debounce')).toBeTruthy();
    expect(size > 30).toBeTruthy();
  },
);
