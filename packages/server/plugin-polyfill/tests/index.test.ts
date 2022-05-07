import type { NormalizedConfig } from '@modern-js/core';
import cliPlugin from '../src/cli';
import serverPlugin from '../src';
import { defaultPolyfill } from '../src/const';

describe('plugin-static-hosting', () => {
  it('cli', () => {
    expect(cliPlugin).toBeDefined();
    const instance = cliPlugin();
    expect(instance.name).toBe('@modern-js/plugin-polyfill');

    const hooks: any = instance.setup?.({
      useResolvedConfigContext: () => {
        return {
          output: {},
        } as NormalizedConfig;
      },
    } as any);

    const params = { entrypoint: [], partials: [] };
    expect(hooks.htmlPartials(params)).toEqual(params);
  });

  it('server', async () => {
    expect(serverPlugin).toBeDefined();
    const instance = serverPlugin();
    expect(instance.name).toBe('@modern-js/plugin-polyfill');

    const hooks: any = instance.setup?.({} as any);
    const fn = hooks.beforeProdServer();
    expect(typeof fn).toBe('function');

    const errorContext = { url: '' };
    expect(await fn(errorContext, () => false)).toBeFalsy();

    const context = {
      url: defaultPolyfill,
      res: {
        setHeader: () => false,
        end: (result: string) => result,
      },
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
      },
    };

    const res = await fn(context);
    expect(res).toMatch('modern polyfill');
    const res1 = await fn(context);
    expect(res1).toMatch('modern polyfill');
  });
});
