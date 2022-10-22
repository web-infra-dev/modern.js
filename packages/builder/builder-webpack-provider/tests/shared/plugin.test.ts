import { describe, expect, it } from 'vitest';
import { PluginBasic } from '@/plugins/basic';
import { PluginDefine } from '@/plugins/define';
import { awaitablePlugins } from '@/shared/plugin';

describe('awaitablePlugins', () => {
  it('should work', async () => {
    const plugins = [PluginBasic(), PluginDefine()];
    const promises = plugins.map(plugin => Promise.resolve(plugin));
    const wrapped = awaitablePlugins(promises);
    expect(wrapped.promises).toStrictEqual(promises);
    expect(await wrapped).toStrictEqual(plugins);
  });
});
