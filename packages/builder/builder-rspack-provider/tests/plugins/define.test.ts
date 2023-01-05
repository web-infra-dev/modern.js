import { describe, expect, it } from 'vitest';
import { createBuilder } from '../helper';
import { PluginDefine } from '@/plugins/define';

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
      NAME: JSON.stringify('Jack'),
    };
    const builder = await createBuilder({
      plugins: [PluginDefine()],
      builderConfig: { source: { globalVars, define } },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchInlineSnapshot(`
      {
        "builtins": {
          "define": {
            "NAME": "\\"Jack\\"",
            "import.meta.bar": "{\\"a\\":\\"bar\\",\\"b\\":false,\\"c\\":{\\"d\\":42}}",
            "process.env.NODE_ENV": "\\"test\\"",
            "process.env.foo": "\\"foo\\"",
            "window.baz": "[null,\\"baz\\"]",
          },
        },
        "module": {},
      }
    `);
  });
});
