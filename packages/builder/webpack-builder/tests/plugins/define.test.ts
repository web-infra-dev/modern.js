import { describe, expect, it } from 'vitest';
import { createStubBuilder } from '../../src/stub';
import { PluginDefine } from '../../src/plugins/define';

describe('plugins/define', () => {
  it('should match snapshot', async () => {
    const globalVars = {
      foo: 'foo',
      bar: {
        a: 'bar',
        b: false,
        c: { d: 42 },
      },
      baz: [null, 'baz'],
    };
    const builder = await createStubBuilder({
      plugins: [PluginDefine()],
      builderConfig: { source: { globalVars } },
    });
    expect(await builder.unwrapWebpackConfig()).toMatchInlineSnapshot(`
      {
        "plugins": [
          DefinePlugin {
            "definitions": {
              "bar": "{\\"a\\":\\"bar\\",\\"b\\":false,\\"c\\":{\\"d\\":42}}",
              "baz": "[null,\\"baz\\"]",
              "foo": "\\"foo\\"",
              "process.env.NODE_ENV": "\\"test\\"",
            },
          },
        ],
      }
    `);
  });
});
