import { expect, describe, it } from 'vitest';
import { setPathSerializer } from '../utils/snapshot';
import { PluginSvg } from '../../src/plugins/svg';
import { createStubBuilder } from '../utils/builder';

describe('plugins/svg', () => {
  setPathSerializer();
  it('export default url', async () => {
    const builder = createStubBuilder({
      plugins: [PluginSvg()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('export default Component', async () => {
    const builder = createStubBuilder({
      plugins: [PluginSvg()],
      builderConfig: {
        output: {
          svgDefaultExport: 'component',
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
