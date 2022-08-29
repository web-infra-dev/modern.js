import { expect, describe, it } from 'vitest';
import { PluginSvg } from '../../src/plugins/svg';
import { createStubBuilder } from '../../src/stub';

describe('plugins/svg', () => {
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

  it('should allow using output.dataUriLimit.svg to custom data uri limit', async () => {
    const builder = createStubBuilder({
      plugins: [PluginSvg()],
      builderConfig: {
        output: {
          dataUriLimit: {
            svg: 666,
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
