import { describe, expect, it } from 'vitest';
import { createStubBuilder } from '../../src/stub';
import { PluginDefine } from '../../src/plugins/define';

describe('plugins/define', () => {
  it('should match snapshot', async () => {
    const globalVars = {
      'process.env.foo': 'foo',
      'import.meta.bar': {
        a: 'bar',
        b: false,
        c: { d: 42 },
      },
      'window.baz': [null, 'baz'],
    };
    const define = {
      'import.meta.test': false,
      cov: () => process.stdout.write('cov'),
    };
    const builder = await createStubBuilder({
      plugins: [PluginDefine()],
      builderConfig: { source: { globalVars, define } },
    });
    expect(await builder.unwrapWebpackConfig()).toMatchInlineSnapshot(`
      {
        "plugins": [
          DefinePlugin {
            "definitions": {
              "cov": [Function],
              "import.meta.bar": "{\\"a\\":\\"bar\\",\\"b\\":false,\\"c\\":{\\"d\\":42}}",
              "import.meta.test": false,
              "process.env.NODE_ENV": "\\"test\\"",
              "process.env.foo": "\\"foo\\"",
              "window.baz": "[null,\\"baz\\"]",
            },
          },
        ],
      }
    `);
  });
});
