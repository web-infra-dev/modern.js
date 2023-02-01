import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';
import { builderPluginSvg } from '@/plugins/svg';

describe('plugins/svg', () => {
  it('export default url', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginSvg()],
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('export default Component', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginSvg()],
      builderConfig: {
        output: {
          svgDefaultExport: 'component',
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow using output.dataUriLimit.svg to custom data uri limit', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginSvg()],
      builderConfig: {
        output: {
          dataUriLimit: {
            svg: 666,
          },
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use distPath.svg to modify dist path', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginSvg()],
      builderConfig: {
        output: {
          distPath: {
            svg: 'foo',
          },
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use filename.svg to modify filename', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginSvg()],
      builderConfig: {
        output: {
          filename: {
            svg: 'foo.svg',
          },
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
