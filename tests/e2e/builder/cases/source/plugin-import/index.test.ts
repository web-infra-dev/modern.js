import path from 'path';
import { rspackOnlyTest, webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';
import { expect } from '@modern-js/e2e/playwright';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';
import { ensureDirSync, copySync } from 'fs-extra';
import { SharedTransformImport } from '@modern-js/builder-shared';
import { BuilderConfig } from '@modern-js/builder-webpack-provider';

/* webpack can receive Function type configuration */
webpackOnlyTest('should import with function customName', async () => {
  copyPkgToNodeModules();

  const setupConfig = {
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  };
  {
    const builder = await build(setupConfig, {
      source: {
        transformImport: [
          {
            libraryName: 'foo',
            customName: (member: string) => `foo/lib/${member}`,
          },
        ],
      },
    });
    const files = await builder.unwrapOutputJSON(false);
    const entry = findEntry(files);
    expect(files[entry]).toContain('transformImport test succeed');
  }

  const builder = await build(
    { ...setupConfig, plugins: [builderPluginSwc()] },
    {
      source: {
        transformImport: [
          {
            libraryName: 'foo',
            customName: (member: string) => `foo/lib/${member}`,
          },
        ],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error rspack and webpack all support this
        disableDefaultEntries: true,
        entries: {
          index: './src/index.js',
        },
      },
    },
  );
  const files = await builder.unwrapOutputJSON(false);
  const entry = findEntry(files);
  expect(files[entry]).toContain('transformImport test succeed');
});

rspackOnlyTest('should import with template config', async () => {
  copyPkgToNodeModules();

  const setupConfig = {
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  };
  const builder = await build(setupConfig, {
    source: {
      transformImport: [
        {
          libraryName: 'foo',
          customName: 'foo/lib/{{ member }}',
        },
      ],
    },
    performance: {
      chunkSplit: {
        strategy: 'all-in-one',
      },
    },
  });
  const files = await builder.unwrapOutputJSON(false);
  const entry = findEntry(files);
  expect(files[entry]).toContain('transformImport test succeed');
});

webpackOnlyTest('should import with template config with SWC', async () => {
  copyPkgToNodeModules();

  const setupConfig = {
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    plugins: [builderPluginSwc()],
  };
  {
    const builder = await build(setupConfig, {
      source: {
        transformImport: [
          {
            libraryName: 'foo',
            customName: 'foo/lib/{{ member }}',
          },
        ],
      },
    });
    const files = await builder.unwrapOutputJSON(false);
    const entry = findEntry(files);
    expect(files[entry]).toContain('transformImport test succeed');
  }

  {
    const builder = await build(setupConfig, {
      source: {
        transformImport: [
          {
            libraryName: 'foo',
            customName: member => `foo/lib/${member}`,
          },
        ],
      },
    });
    const files = await builder.unwrapOutputJSON(false);
    const entry = findEntry(files);
    expect(files[entry]).toContain('transformImport test succeed');
  }
});

shareTest('camelCase test', './src/camel.js', {
  libraryName: 'foo',
  libraryDirectory: 'lib',
  camelToDashComponentName: false,
});

shareTest('kebab-case test', './src/kebab.js', {
  libraryName: 'foo',
  libraryDirectory: 'lib',
  camelToDashComponentName: true,
});

shareTest('transform to named import', './src/named.js', {
  libraryName: 'foo',
  libraryDirectory: 'lib',
  camelToDashComponentName: true,
  transformToDefaultImport: false,
});

function findEntry(files: Record<string, string>, name = 'index'): string {
  for (const key of Reflect.ownKeys(files) as string[]) {
    if (key.includes(`dist/static/js/${name}`) && key.endsWith('.js')) {
      return key;
    }
  }

  throw new Error('unreacheable');
}

function copyPkgToNodeModules() {
  const nodeModules = path.resolve(__dirname, 'node_modules');

  ensureDirSync(nodeModules);
  copySync(path.resolve(__dirname, 'foo'), path.resolve(nodeModules, 'foo'));
}

function shareTest(
  msg: string,
  entry: string,
  transformImport: SharedTransformImport,
) {
  const setupConfig = {
    cwd: __dirname,
    entry: {
      index: entry,
    },
  };
  const config: BuilderConfig = {
    source: {
      transformImport: [transformImport],
    },
    performance: {
      chunkSplit: {
        strategy: 'all-in-one',
      },
    },
  };

  // webpack
  webpackOnlyTest(`${msg}-webpack`, async () => {
    const builder = await build(setupConfig, { ...config });
    const files = await builder.unwrapOutputJSON(false);
    expect(files[findEntry(files)]).toContain('transformImport test succeed');
  });

  // webpack with swc
  webpackOnlyTest(`${msg}-webpack-swc`, async () => {
    const builder = await build(
      {
        ...setupConfig,
        plugins: [builderPluginSwc()],
      },
      { ...config },
    );
    const files = await builder.unwrapOutputJSON(false);
    expect(files[findEntry(files)]).toContain('transformImport test succeed');
  });

  // rspack
  rspackOnlyTest(`${msg}-rspack`, async () => {
    const builder = await build(setupConfig, { ...config });
    const files = await builder.unwrapOutputJSON(false);
    expect(files[findEntry(files)]).toContain('transformImport test succeed');
  });
}
