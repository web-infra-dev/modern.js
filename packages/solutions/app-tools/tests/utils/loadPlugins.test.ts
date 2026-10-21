import path from 'node:path';
import { getServerPlugins } from '../../src/utils/loadPlugins';

describe('internal server plugin entries', () => {
  it('retains resolved absolute entries while filtering package names by distribution', async () => {
    const absolute = path.resolve(__dirname, 'adapter/server.js');
    const plugins = [
      { name: absolute },
      { name: '@modern-js/server-plugin' },
      { name: '@other/server-plugin' },
    ];
    const updateAppContext = rstest.fn();
    const api = {
      getHooks: () => ({
        _internalServerPlugins: { call: async () => ({ plugins }) },
      }),
      updateAppContext,
    } as any;
    const selected = await getServerPlugins(api, 'modern-js');
    expect(selected).toEqual(plugins.slice(0, 2));
    expect(updateAppContext).toHaveBeenCalledWith({ serverPlugins: selected });
    expect(await getServerPlugins(api, 'other')).toEqual([
      plugins[0],
      plugins[2],
    ]);
  });
});
