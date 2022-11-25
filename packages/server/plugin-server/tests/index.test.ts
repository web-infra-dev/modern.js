import path from 'path';
import cliPlugin from '../src/cli';
import serverPlugin from '../src/server';

describe('plugin-server', () => {
  it('cli', () => {
    expect(cliPlugin).toBeDefined();
    expect(cliPlugin().name).toBe('@modern-js/plugin-server');
  });

  it('should legency server hook work correctly', () => {
    expect(serverPlugin).toBeDefined();
    const plugin = serverPlugin();
    expect(plugin.name).toBe('@modern-js/plugin-server');

    const hooks: any = plugin.setup!({
      useAppContext: () => ({
        appDirectory: path.join(__dirname, './fixtures/legency'),
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

    hooks.afterMatch(sign);
    hooks.afterRender(sign);
    hooks.reset();
    expect(sign.status).toBe(3);
  });

  it('should new server hook work correctly', () => {
    expect(serverPlugin).toBeDefined();
    const plugin = serverPlugin();
    expect(plugin.name).toBe('@modern-js/plugin-server');

    const hooks: any = plugin.setup!({
      useAppContext: () => ({
        appDirectory: path.join(__dirname, './fixtures/new'),
      }),
    } as any);

    hooks.prepare();
    const sign = { status: 0 };

    hooks.afterMatch(sign);
    hooks.afterRender(sign);
    hooks.reset();
    expect(sign.status).toBe(4);
  });

  it('should mix server hook work correctly', () => {
    expect(serverPlugin).toBeDefined();
    const plugin = serverPlugin();
    expect(plugin.name).toBe('@modern-js/plugin-server');

    const hooks: any = plugin.setup!({
      useAppContext: () => ({
        appDirectory: path.join(__dirname, './fixtures/mix'),
      }),
    } as any);
    hooks.prepare();

    const sign = { status: 0 };
    hooks.gather({
      addWebMiddleware: (fn: any) => {
        fn(sign);
      },
    });
    expect(sign.status).toBe(4);

    hooks.afterMatch(sign);
    hooks.afterRender(sign);
    expect(sign.status).toBe(8);
  });
});
