import { expect, describe, it } from 'vitest';
import { builderPluginSvg } from '@/plugins/svg';
import { createStubBuilder } from '@/stub';

describe('plugins/svg', () => {
  it('export default url', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginSvg()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('export default Component', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginSvg()],
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
    const builder = await createStubBuilder({
      plugins: [builderPluginSvg()],
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

  it('should allow to use distPath.svg to modify dist path', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginSvg()],
      builderConfig: {
        output: {
          distPath: {
            svg: 'foo',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to use filename.svg to modify filename', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginSvg()],
      builderConfig: {
        output: {
          filename: {
            svg: 'foo.svg',
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
