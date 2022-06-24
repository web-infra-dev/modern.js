import path from 'path';
import { AppContext, manager, createAsyncWorkflow } from '@modern-js/core';
import { fs } from '@modern-js/utils';
import plugin from '../src';
import { getPluginsCode, getRequireCode } from '../src/utils';

describe('plugin-multiprocess', () => {
  const distDirectory = path.join(__dirname, './fixtures/ssr-bff');

  afterAll(() => {
    fs.removeSync(path.join(distDirectory, 'api-server'));
    fs.removeSync(path.join(distDirectory, 'ssr-server'));
    fs.removeSync(path.join(distDirectory, 'web-server'));
  });

  it('default', async () => {
    expect(plugin).toBeDefined();
    expect(plugin().name).toBe('@modern-js/plugin-multiprocess');

    const afterBuild = createAsyncWorkflow<any, any>();
    manager.registerHook({
      afterBuild,
    });
    manager.usePlugin(plugin);
    AppContext.set({
      distDirectory,
      plugins: [],
    } as any);
    const runner = await manager.init();
    runner.afterBuild();
  });

  it('should generate code correctly', () => {
    const pluginCode = getPluginsCode(['pluginA', 'pluginB']);
    expect(pluginCode).toBe('[plugin_0,plugin_1]');

    const requireCode = getRequireCode(['pluginA', 'pluginB']);
    expect(requireCode).toBe(`const mod_0 = require('pluginA');
const plugin_0 =  mod_0.default || mod_0;
const mod_1 = require('pluginB');
const plugin_1 =  mod_1.default || mod_1;`);
  });
});
