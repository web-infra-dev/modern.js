import path from 'path';
import { rspackOnlyTest, webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';
import { expect } from '@modern-js/e2e/playwright';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';

/* webpack can receive Function type configuration */
webpackOnlyTest('should import with function customName', async () => {
  const setupConfig = {
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  };
  {
    const builder = await build(setupConfig, {
      source: {
        transformImport: [
          {
            libraryName: './foo',
            customName: (_: string) => `./foo/lib/foo.js`,
          },
        ],
      },
    });
    const files = await builder.unwrapOutputJSON(false);
    const entry = findEntry(files);
    expect(files[entry]).toContain('transformImport test succeed');
  }

  {
    const builder = await build(
      { ...setupConfig, plugins: [builderPluginSwc()] },
      {
        source: {
          transformImport: [
            {
              libraryName: './foo',
              customName: (_: string) => `./foo/lib/foo.js`,
            },
          ],
        },
      },
    );
    const files = await builder.unwrapOutputJSON(false);
    const entry = findEntry(files);
    expect(files[entry]).toContain('transformImport test succeed');
  }
});

rspackOnlyTest('should import with template config', async () => {
  const setupConfig = {
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  };
  {
    const builder = await build(setupConfig, {
      source: {
        transformImport: [
          {
            libraryName: './foo',
            customName: './foo/lib/{{ member }}',
          },
        ],
      },
    });
    const files = await builder.unwrapOutputJSON(false);
    const entry = findEntry(files);
    expect(files[entry]).toContain('transformImport test succeed');
  }
});

webpackOnlyTest('should import with template config with SWC', async () => {
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
            libraryName: './foo',
            customName: './foo/lib/{{ member }}',
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
            libraryName: './foo',
            customName: member => `./foo/lib/${member}`,
          },
        ],
      },
    });
    const files = await builder.unwrapOutputJSON(false);
    const entry = findEntry(files);
    expect(files[entry]).toContain('transformImport test succeed');
  }
});

function findEntry(files: Record<string, string>): string {
  for (const key of Reflect.ownKeys(files) as string[]) {
    if (key.includes('dist/static/js/index') && key.endsWith('.js')) {
      return key;
    }
  }

  throw new Error('unreacheable');
}
