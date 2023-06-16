import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { builderPluginSourceBuild } from '../src';

describe('plugins/source-build', () => {
  it('should add source-build config', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginSourceBuild()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
