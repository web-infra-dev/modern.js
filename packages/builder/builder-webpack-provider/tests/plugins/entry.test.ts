import { expect, describe, it } from 'vitest';
import { PluginEntry } from '@/plugins/entry';
import { createStubBuilder } from '@/stub';

describe('plugins/entry', () => {
  it('should set entry correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry()],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set multiple entry correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry()],
      entry: {
        foo: ['./src/polyfill.ts', './src/foo.ts'],
        bar: ['./src/polyfill.ts', './src/bar.ts'],
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set pre-entry correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry()],
      entry: {
        foo: ['./src/polyfill.ts', './src/foo.ts'],
        bar: './src/bar.ts',
      },
      builderConfig: {
        source: {
          preEntry: './src/pre-entry.ts',
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
