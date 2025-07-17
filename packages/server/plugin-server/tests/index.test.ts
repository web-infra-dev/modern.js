import path from 'path';
import cliPlugin from '../src/cli';
import serverPlugin from '../src/server';

describe('plugin-server', () => {
  it('cli', () => {
    expect(cliPlugin).toBeDefined();
    expect(cliPlugin().name).toBe('@modern-js/plugin-server');
  });

  it('should new server hook work correctly', async () => {
    expect(serverPlugin).toBeDefined();
    const plugin = serverPlugin();
    expect(plugin.name).toBe('@modern-js/plugin-server');

    const hooks: Record<string, any> = {
      onPrepare: undefined,
      afterMatch: undefined,
      afterRender: undefined,
      onReset: undefined,
    };
    plugin.setup!({
      getServerContext: () => ({
        appDirectory: path.join(__dirname, './fixtures/new'),
      }),
      onPrepare: (fn: any) => {
        hooks.onPrepare = fn;
      },
      onReset: (fn: any) => {
        hooks.onReset = fn;
      },
      afterMatch: (fn: any) => {
        hooks.afterMatch = fn;
      },
      afterRender: (fn: any) => {
        hooks.afterRender = fn;
      },
      prepareWebServer: (fn: any) => {},
    } as any);

    await hooks.onPrepare();
    const sign = { status: 0 };

    await hooks.afterMatch(sign);
    await hooks.afterRender(sign);
    await hooks.onReset();
    expect(sign.status).toBe(4);
  });
});
