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

    const hooks: any = plugin.setup!({
      useAppContext: () => ({
        appDirectory: path.join(__dirname, './fixtures/new'),
      }),
    } as any);

    await hooks.prepare();
    const sign = { status: 0 };

    await hooks.afterMatch(sign);
    await hooks.afterRender(sign);
    await hooks.reset();
    expect(sign.status).toBe(4);
  });
});
