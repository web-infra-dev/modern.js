import { expect, describe, it } from 'vitest';
import { PluginYaml } from '../../src/plugins/yaml';
import { createStubBuilder } from '../../src/stub/builder';

describe('plugins/yaml', () => {
  it('should add yaml rule properly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginYaml()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
