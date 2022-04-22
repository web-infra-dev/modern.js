import type { NormalizedConfig } from '@modern-js/core';
import type { BabelChain } from '@modern-js/babel-chain';
import { mergeRegex } from '../src/utils/mergeRegex';
import { getBabelOptions } from '../src/utils/getBabelOptions';

describe('mergeRegex', () => {
  it('should merge regexp correctly', () => {
    expect(mergeRegex(/\.js$/, /\.ts$/)).toEqual(/\.js$|\.ts$/);
  });

  it('should merge string correctly', () => {
    expect(mergeRegex('\\.js$', '\\.ts$')).toEqual(/\.js$|\.ts$/);
  });
});

describe('getBabelOptions', () => {
  it('should return babel options as expected', () => {
    const babelOptions = getBabelOptions(
      'metaName',
      '/root',
      {} as NormalizedConfig,
      {} as BabelChain,
    );

    // mock dynamic preset name
    babelOptions.presets[0][0] = 'preset-name';

    expect(babelOptions).toEqual({
      babelrc: false,
      compact: false,
      configFile: false,
      presets: [
        [
          'preset-name',
          {
            appDirectory: '/root',
            chain: {},
            lodash: { id: ['lodash', 'ramda'] },
            metaName: 'metaName',
            styledComponents: {
              displayName: true,
              pure: true,
              ssr: false,
              transpileTemplateLiterals: true,
            },
            target: 'client',
            useBuiltIns: undefined,
            useLegacyDecorators: true,
            userBabelConfig: undefined,
          },
        ],
      ],
    });

    // mockRequireResolve.mockRestore();
  });
});
