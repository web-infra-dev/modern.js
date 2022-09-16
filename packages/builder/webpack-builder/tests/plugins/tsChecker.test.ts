import { expect, describe, it } from 'vitest';
import { PluginTsLoader } from '../../src/plugins/tsLoader';
import { createStubBuilder } from '../../src/stub';

describe('plugins/tsChecker', () => {
  it("should't set ts-checker", async () => {
    const builder = await createStubBuilder({
      plugins: [PluginTsLoader()],
      builderConfig: {
        tools: {
          tsChecker: false,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set tsChecker plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginTsLoader()],
      builderConfig: {
        tools: {},
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
