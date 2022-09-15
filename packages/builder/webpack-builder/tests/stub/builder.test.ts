import path from 'path';
import { describe, expect, it } from 'vitest';
import { Volume, createFsFromVolume } from 'memfs';
import { createStubBuilder } from '../../src/stub';
import { normalizeStubPluginOptions } from '../../src/stub/builder';

describe('StubBuilder', () => {
  it('should run webpack and output to memfs', async () => {
    const builder = await createStubBuilder({ webpack: 'in-memory' });
    builder.hooks.onAfterCreateCompilerHooks.tap(async ({ compiler }) => {
      const filename = path.resolve('./src/index.js');
      const vol = Volume.fromJSON({ [filename]: 'console.log(42)' });
      compiler.inputFileSystem = createFsFromVolume(vol);
    });
    expect(await builder.unwrapOutputJSON()).toMatchInlineSnapshot(`
      {
        "<ROOT>/packages/builder/webpack-builder/dist/main.js": "console.log(42);",
      }
    `);
  });
});

describe('normalizeStubPluginOptions', () => {
  it.each([
    [undefined, { builtin: false, additional: [] }],
    [true, { builtin: true, additional: [] }],
    ['minimal', { builtin: 'minimal', additional: [] }],
    ['default', { builtin: 'default', additional: [] }],
    [{}, { builtin: false, additional: [] }],
    [{ builtin: true }, { builtin: true, additional: [] }],
    [{ builtin: 'minimal' }, { builtin: 'minimal', additional: [] }],
    [{ builtin: 'default' }, { builtin: 'default', additional: [] }],
    [{ additional: [] }, { builtin: false, additional: [] }],
    [{ additional: ['a'] }, { builtin: false, additional: ['a'] }],
    [['a', 'b'], { builtin: false, additional: ['a', 'b'] }],
    [
      { builtin: 'minimal', additional: ['a', 'b'] },
      { builtin: 'minimal', additional: ['a', 'b'] },
    ],
  ])(`should normalize %p to %p`, (input: any, expected) => {
    expect(normalizeStubPluginOptions(input)).toEqual(expected);
  });
});
