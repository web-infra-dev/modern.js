import path from 'path';
import { build } from '@scripts/shared';
import { expect, test } from '@modern-js/e2e/playwright';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';
import { findEntry, copyPkgToNodeModules, cases, shareTest } from './helper';

/* webpack can receive Function type configuration */
test('should import with function customName', async () => {
  copyPkgToNodeModules();

  const setupConfig = {
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  };

  {
    const builder = await build({
      ...setupConfig,
      builderConfig: {
        source: {
          transformImport: [
            {
              libraryName: 'foo',
              customName: (member: string) => `foo/lib/${member}`,
            },
          ],
        },
      },
    });
    const files = await builder.unwrapOutputJSON(false);
    const entry = findEntry(files);
    expect(files[entry]).toContain('transformImport test succeed');
  }

  const builder = await build({
    ...setupConfig,
    plugins: [builderPluginSwc()],
    builderConfig: {
      source: {
        transformImport: [
          {
            libraryName: 'foo',
            customName: (member: string) => `foo/lib/${member}`,
          },
        ],

        // @ts-expect-error rspack and webpack all support this
        disableDefaultEntries: true,
        entries: {
          index: './src/index.js',
        },
      },
    },
  });
  const files = await builder.unwrapOutputJSON(false);
  const entry = findEntry(files);
  expect(files[entry]).toContain('transformImport test succeed');
});

test('should import with template config with SWC', async () => {
  copyPkgToNodeModules();

  const setupConfig = {
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    plugins: [builderPluginSwc()],
  };

  {
    const builder = await build({
      ...setupConfig,
      builderConfig: {
        source: {
          transformImport: [
            {
              libraryName: 'foo',
              customName: 'foo/lib/{{ member }}',
            },
          ],
        },
      },
    });
    const files = await builder.unwrapOutputJSON(false);
    const entry = findEntry(files);
    expect(files[entry]).toContain('transformImport test succeed');
  }

  {
    const builder = await build({
      ...setupConfig,
      builderConfig: {
        source: {
          transformImport: [
            {
              libraryName: 'foo',
              customName: member => `foo/lib/${member}`,
            },
          ],
        },
      },
    });
    const files = await builder.unwrapOutputJSON(false);
    const entry = findEntry(files);
    expect(files[entry]).toContain('transformImport test succeed');
  }
});

cases.forEach(c => {
  const [name, entry, config] = c;
  shareTest(`${name}-webpack`, entry, config);

  shareTest(`${name}-webpack-swc`, entry, config, {
    plugins: [builderPluginSwc()],
  });
});
