import { Volume } from 'memfs';
import { describe, expect, it } from 'vitest';
import { createStubBuilder } from '../../src/stub';

describe('createStubBuilder', () => {
  it('should enable webpack with memory fs', async () => {
    const vol = Volume.fromJSON({
      './src/index.js': 'console.log(1);',
    });
    const builder = createStubBuilder({
      webpack: vol,
    });
    await builder.build();
    expect(vol.toJSON()).toMatchInlineSnapshot(`
      {
        "<ROOT>/packages/builder/webpack-builder/dist/main.js": "console.log(1);",
        "<ROOT>/packages/builder/webpack-builder/src/index.js": "console.log(1);",
      }
    `);
  });
});
