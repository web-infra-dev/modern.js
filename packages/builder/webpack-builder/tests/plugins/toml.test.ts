import { expect, describe, it } from 'vitest';
import { PluginToml } from '../../src/plugins/toml';
import { createStubBuilder } from '../../src/stub/builder';

describe('plugins/toml', () => {
  it('should add toml rule properly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginToml()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
