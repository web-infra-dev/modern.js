import { describe, it, expect } from 'vitest';
import { createUniBuilder } from '../src';
import { matchPlugins, unwrapConfig } from './helper';

describe('plugin-global-vars', () => {
  const cases = [
    {
      name: 'globalVars',
      options: {
        'process.env.foo': 'foo',
        'import.meta.bar': {
          a: 'bar',
          b: false,
          c: { d: 42 },
        },
        'window.baz': [null, 'baz'],
      },
    },
    {
      name: 'globalVars function',
      options: (obj: any, { env, target }: any) => {
        obj.ENV = env;
        obj.TARGET = target;
      },
    },
  ];

  it.each(cases)('$name', async item => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      cwd: '',
      config: {
        source: {
          globalVars: item.options,
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchPlugins(config, 'DefinePlugin')).toMatchSnapshot();
  });
});
