import { expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { builderAssetPlugin } from '@/plugins/asset';

describe('plugins/asset(image)', () => {
  const cases = [
    {
      name: 'should add image rules correctly',
      builderConfig: {},
    },
    {
      name: 'should allow to use distPath.image to modify dist path',
      builderConfig: {
        output: {
          distPath: {
            image: 'foo',
          },
        },
      },
    },
    {
      name: 'should allow to use distPath.image to be empty string',
      builderConfig: {
        output: {
          distPath: {
            image: '',
          },
        },
      },
    },
    {
      name: 'should allow to use filename.image to modify filename',
      builderConfig: {
        output: {
          filename: {
            image: 'foo[ext]',
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

    builderAssetPlugin('image', shared.IMAGE_EXTENSIONS).setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain, {
      CHAIN_ID: {
        RULE: {
          IMAGE: 'image',
        },
      },
    });

    expect(chain.toConfig()).toMatchSnapshot();
  });
});
