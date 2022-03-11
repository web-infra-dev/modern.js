import { createApp, createPlugin, useRuntimeContext } from '../src';
import plugin from '../src/cli';

describe('plugin-runtime', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(createApp).toBeDefined();
    expect(createPlugin).toBeDefined();
    expect(useRuntimeContext).toBeDefined();

    const hooks = plugin.initializer();
    expect(hooks.beforeRestart).toBeDefined();
  });
});
