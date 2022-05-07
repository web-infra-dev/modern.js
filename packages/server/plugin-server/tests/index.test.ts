import path from 'path';
import cliPlugin from '../src/cli';
import serverPlugin from '../src/server';

describe('plugin-server', () => {
  it('cli', () => {
    expect(cliPlugin).toBeDefined();
    expect(cliPlugin().name).toBe('@modern-js/plugin-server');
  });

  it('server', () => {
    expect(serverPlugin).toBeDefined();

    const plugin = serverPlugin();
    expect(plugin.name).toBe('@modern-js/plugin-server');

    const hooks: any = plugin.setup!({
      useAppContext: () => ({
        appDirectory: path.join(__dirname, './fixtures/foo'),
      }),
    } as any);

    hooks.prepare();

    const sign = { status: 0 };
    hooks.gather({
      addWebMiddleware: (fn: any) => {
        fn(sign);
      },
    });
    expect(sign.status).toBe(1);

    const params = { context: sign };
    hooks.beforeMatch(params);
    hooks.afterMatch(params);
    hooks.beforeRender(params);
    hooks.afterRender(params);
    hooks.reset();
    expect(sign.status).toBe(5);
  });
});
