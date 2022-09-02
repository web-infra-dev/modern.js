import { expect, describe, it } from 'vitest';
import { PluginInspector } from '../../src/plugins/inspector';
import { createStubBuilder } from '../utils/builder';

describe('plugins/inspector', () => {
  it('should add inspector plugin when tools.inspector is set', async () => {
    const builder = createStubBuilder({
      plugins: [PluginInspector()],
      builderConfig: {
        tools: {
          inspector: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not add inspector plugin', async () => {
    const builder = createStubBuilder({
      plugins: [PluginInspector()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
