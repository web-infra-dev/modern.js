import { expect, describe, it } from 'vitest';
import { PluginPug } from '@/plugins/pug';
import { createStubBuilder } from '@/stub/builder';

describe('plugins/pug', () => {
  it('should add pug rules correctly when tools.pug is used', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginPug()],
      builderConfig: {
        tools: {
          pug: {
            pretty: true,
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should not add pug rules correctly when tools.pug is not used', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginPug()],
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toEqual({});
  });
});
