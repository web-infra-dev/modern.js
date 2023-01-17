import { expect, describe, it } from 'vitest';
import { builderPluginTsLoader } from '@/plugins/tsLoader';
import { createStubBuilder } from '@/stub';

describe('plugins/tsLoader', () => {
  it('should set ts-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginTsLoader()],
      builderConfig: {
        tools: {
          tsLoader: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set include/exclude', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginTsLoader()],
      builderConfig: {
        tools: {
          tsLoader(options, { addIncludes, addExcludes }) {
            addIncludes(['src/**/*.ts']);
            addExcludes(['src/**/*.js']);
            return options;
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
