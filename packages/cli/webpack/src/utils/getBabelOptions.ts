import { isProd, applyOptionsChain, isUseSSRBundle } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';
import { Options as BabelPresetAppOptions } from '@modern-js/babel-preset-app';
import type { BabelChain } from '@modern-js/babel-chain';

export const getBabelOptions = (
  metaName: string,
  appDirectory: string,
  config: NormalizedConfig,
  chain: BabelChain,
) => ({
  babelrc: false,
  configFile: false,
  compact: isProd(),
  presets: [
    [
      require.resolve('@modern-js/babel-preset-app'),
      {
        metaName,
        appDirectory,
        target: 'client',
        lodash: applyOptionsChain(
          { id: ['lodash', 'ramda'] },
          config.tools?.lodash as any,
        ),
        useLegacyDecorators: !config.output?.enableLatestDecorators,
        useBuiltIns:
          config.output?.polyfill === 'ua' || config.output?.polyfill === 'off'
            ? false
            : config.output?.polyfill,
        chain,
        styledComponents: applyOptionsChain(
          {
            pure: true,
            displayName: true,
            ssr: isUseSSRBundle(config),
            transpileTemplateLiterals: true,
          },
          config.tools?.styledComponents,
        ),
        userBabelConfig: config.tools?.babel,
      } as BabelPresetAppOptions,
    ],
  ],
});
