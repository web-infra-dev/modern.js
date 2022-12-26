import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { PluginStylus } from '../src';

describe('plugins/stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginStylus()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const builder = await createStubBuilder({
      plugins: [
        PluginStylus({
          stylusOptions: {
            lineNumbers: false,
          },
        }),
      ],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
