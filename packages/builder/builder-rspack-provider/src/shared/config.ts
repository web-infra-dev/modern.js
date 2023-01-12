import type { BuilderTarget, BundlerChain } from '@modern-js/builder-shared';
import { NormalizedConfig } from '../types';

// todo: rspack not support false
export const isUseCssExtract = (
  _config: NormalizedConfig,
  _target: BuilderTarget,
) => true;
// config.tools.cssExtract !== false &&
// !config.tools.styleLoader &&
// target !== 'node' &&
// target !== 'web-worker';

export const chainStaticAssetRule = ({
  chain,
  regExp,
  maxSize,
  filename,
  assetType,
}: {
  chain: BundlerChain;
  regExp: RegExp;
  maxSize: number;
  filename: string;
  assetType: string;
}) => {
  // todo: not support oneOf yet. should use oneOf and Specified CHAIN_ID refactor
  // rspack not support dataUrlCondition function
  // should use the last matching type if it is matched with multiple module type
  // default: when size < dataUrlCondition.maxSize will inline
  chain.module
    .rule(`${assetType}-default`)
    .test(regExp)
    .type('asset')
    .parser({
      dataUrlCondition: {
        maxSize,
      },
    })
    .set('generator', {
      filename,
    })
    .end();

  // forceInline: "foo.png?inline" or "foo.png?__inline",
  chain.module
    .rule(`${assetType}-inline`)
    .test(regExp)
    .type('asset/inline')
    .resourceQuery(/inline/)
    .end();

  // forceNoInline: "foo.png?__inline=false" or "foo.png?url",
  chain.module
    .rule(`${assetType}-url`)
    .test(regExp)
    .type('asset')
    .resourceQuery(/(__inline=false|url)/)
    .set('generator', {
      filename,
    })
    .parser({
      dataUrlCondition: {
        maxSize: 0,
      },
    })
    .end();
};
