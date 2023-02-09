import type {
  BuilderTarget,
  BundlerChainRule,
} from '@modern-js/builder-shared';
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
  rule,
  maxSize,
  filename,
  assetType,
  issuer,
}: {
  rule: BundlerChainRule;
  maxSize: number;
  filename: string;
  assetType: string;
  issuer?: any;
}) => {
  // rspack not support dataUrlCondition function
  // forceNoInline: "foo.png?__inline=false" or "foo.png?url",
  rule
    .oneOf(`${assetType}-asset-url`)
    .type('asset')
    .resourceQuery(/(__inline=false|url)/)
    .set('generator', {
      filename,
    })
    .set('issuer', issuer)
    .parser({
      dataUrlCondition: {
        maxSize: 0,
      },
    });

  // forceInline: "foo.png?inline" or "foo.png?__inline",
  rule
    .oneOf(`${assetType}-asset-inline`)
    .type('asset/inline')
    .resourceQuery(/inline/)
    .set('issuer', issuer);

  // default: when size < dataUrlCondition.maxSize will inline
  rule
    .oneOf(`${assetType}-asset-default`)
    .type('asset')
    .parser({
      dataUrlCondition: {
        maxSize,
      },
    })
    .set('generator', {
      filename,
    })
    .set('issuer', issuer);
};
