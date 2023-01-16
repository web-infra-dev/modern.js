import { expect, describe, it } from 'vitest';
import { builderPluginInspector } from '@/plugins/inspector';
import { createStubBuilder } from '@/stub/builder';

describe('plugins/inspector', () => {
  it('should add inspector plugin when tools.inspector is set', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginInspector()],
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
    const builder = await createStubBuilder({
      plugins: [builderPluginInspector()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
