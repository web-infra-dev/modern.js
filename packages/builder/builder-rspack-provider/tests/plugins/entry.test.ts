import { expect, describe, it } from 'vitest';
import { createBuilder } from '../createBuilder';
import { PluginEntry } from '@/plugins/entry';

describe('plugins/entry', () => {
  it('should set entry correctly', async () => {
    const builder = await createBuilder({
      plugins: [PluginEntry()],
      entry: {
        main: './src/main.ts',
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchInlineSnapshot(`
      {
        "entry": {
          "main": "./src/main.ts",
        },
      }
    `);
  });

  it('should set multiple entry correctly', async () => {
    const builder = await createBuilder({
      plugins: [PluginEntry()],
      entry: {
        foo: ['./src/polyfill.ts', './src/foo.ts'],
        bar: ['./src/polyfill.ts', './src/bar.ts'],
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchInlineSnapshot(`
      {
        "entry": {
          "bar": [
            "./src/polyfill.ts",
            "./src/bar.ts",
          ],
          "foo": [
            "./src/polyfill.ts",
            "./src/foo.ts",
          ],
        },
      }
    `);
  });

  it('should set pre-entry correctly', async () => {
    const builder = await createBuilder({
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
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchInlineSnapshot(`
      {
        "entry": {
          "bar": [
            "./src/pre-entry.ts",
            "./src/bar.ts",
          ],
          "foo": [
            "./src/pre-entry.ts",
            "./src/polyfill.ts",
            "./src/foo.ts",
          ],
        },
      }
    `);
  });
});
