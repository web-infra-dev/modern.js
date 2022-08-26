import { expect, describe, it } from 'vitest';
import { PluginYaml } from '../../src/plugins/yaml';
import { createStubBuilder } from '../utils/builder';

describe('plugins/yaml', () => {
  it('should add yaml rule properly', async () => {
    const builder = createStubBuilder({
      plugins: [PluginYaml()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
