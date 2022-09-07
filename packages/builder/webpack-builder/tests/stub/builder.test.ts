import { describe, expect, it } from 'vitest';
import { Volume, createFsFromVolume } from 'memfs';
import { createStubBuilder } from '../../src/stub';

describe('StubBuilder', () => {
  it('should run webpack and output to memfs', async () => {
    const builder = createStubBuilder({ webpack: 'in-memory' });
    builder.hooks.onAfterCreateCompilerHooks.tap(async ({ compiler }) => {
      const vol = Volume.fromJSON({
        [`${process.cwd()}/src/index.js`]: 'console.log(42)',
      });
      compiler.inputFileSystem = createFsFromVolume(vol);
    });
    const vol = await builder.unwrapOutputVolume();
    expect(vol.toJSON()).toMatchInlineSnapshot(`
      {
        "<ROOT>/packages/builder/webpack-builder/dist/main.js": "console.log(42);",
      }
    `);
  });
});
