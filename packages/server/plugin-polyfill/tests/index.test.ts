import type { NormalizedConfig } from '@modern-js/core';
import { createServerBase } from '@modern-js/server-core';
import cliPlugin from '../src/cli';
import serverPlugin from '../src';
import { defaultPolyfill } from '../src/const';

function getDefaultConfig() {
  return {
    html: {},
    output: {},
    source: {},
    tools: {},
    server: {},
    runtime: {},
    bff: {},
    dev: {},
    security: {},
  };
}

describe('plugin-static-hosting', () => {
  it('cli', () => {
    expect(cliPlugin).toBeDefined();
    const instance = cliPlugin();
    expect(instance.name).toBe('@modern-js/plugin-polyfill');

    const hooks: any = instance.setup?.({
      useResolvedConfigContext: () => {
        return {
          output: {},
        } as unknown as NormalizedConfig;
      },
    } as any);

    const params = { entrypoint: [], partials: [] };
    expect(hooks.htmlPartials(params)).toEqual(params);
  });

  it('polyfill middleware', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: {},
    });

    expect(serverPlugin).toBeDefined();
    const instance = serverPlugin();
    expect(instance.name).toBe('@modern-js/plugin-polyfill');

    const hooks: any = instance.setup?.({
      useAppContext: () => {
        return {
          serverBase: server,
        };
      },
    } as any);
    await hooks.prepare();
    const res = await server.request(defaultPolyfill, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
      },
    });
    const text = await res.text();
    expect(text).toMatch('modern polyfill');
  });
});
