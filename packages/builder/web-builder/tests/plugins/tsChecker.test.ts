import { expect, describe, it } from 'vitest';
import { PluginTsLoader } from '../../src/plugins/tsLoader';
import { setPathSerializer } from '../utils/snapshot';
import { createStubBuilder } from '../utils/builder';

describe('plugins/tsChecker', () => {
  setPathSerializer();

  it("should't set ts-checker", async () => {
    const builder = createStubBuilder({
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
    const builder = createStubBuilder({
      plugins: [PluginTsLoader()],
      builderConfig: {
        tools: {},
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
