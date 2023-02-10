import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { CHAIN_ID } from '@modern-js/utils';
import { builderPluginSvg } from '@/plugins/svg';

describe('plugins/svg', () => {
  const cases = [
    {
      name: 'export default url',
      builderConfig: {},
    },
    {
      name: 'export default Component',
      builderConfig: {
        output: {
          svgDefaultExport: 'component',
        },
      },
    },
    {
      name: 'should allow using output.dataUriLimit.svg to custom data uri limit',
      builderConfig: {
        output: {
          dataUriLimit: {
            svg: 666,
          },
        },
      },
    },
    {
      name: 'should allow to use distPath.svg to modify dist path',
      builderConfig: {
        output: {
          distPath: {
            svg: 'foo',
          },
        },
      },
    },
    {
      name: 'should allow to use filename.svg to modify filename',
      builderConfig: {
        output: {
          filename: {
            svg: 'foo.svg',
          },
        },
      },
    },
  ];

  it.each(cases)('$name', async item => {
    let modifyBundlerChainCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        ...item.builderConfig,
        output: {
          ...shared.defaultOutputConfig,
          ...(item.builderConfig?.output || {}),
        },
      }),
      context: {
        rootPath: __dirname,
      },
    };

    builderPluginSvg().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      CHAIN_ID,
    });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
