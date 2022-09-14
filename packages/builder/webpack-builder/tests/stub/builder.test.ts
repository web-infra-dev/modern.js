import path from 'path';
import { describe, expect, it } from 'vitest';
import { Volume, createFsFromVolume } from 'memfs';
import { createStubBuilder } from '../../src/stub';

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
