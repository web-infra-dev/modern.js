import type { MetaOptions } from '@modern-js/uni-builder';
import type { SSGConfig } from '../config';

type CrossOrigin = 'anonymous' | 'use-credentials';

export type OutputLegacyUserConfig = {
  assetPrefix?: string;
  htmlPath?: string;
  jsPath?: string;
  cssPath?: string;
  mediaPath?: string;
  path?: string;
  title?: string;
  meta?: MetaOptions;
  inject?: 'body' | 'head' | boolean;
  mountId?: string;
  favicon?: string;
  copy?: Array<Record<string, unknown> & { from: string }>;
  disableTsChecker?: boolean;
  disableHtmlFolder?: boolean;
  disableCssModuleExtension?: boolean;
  disableCssExtract?: boolean;
  enableCssModuleTSDeclaration?: boolean;
  disableMinimize?: boolean;
  enableInlineStyles?: boolean;
  enableInlineScripts?: boolean;
  disableSourceMap?: boolean;
  disableInlineRuntimeChunk?: boolean;
  disableAssetsCache?: boolean;
  enableLatestDecorators?: boolean;
  polyfill?: 'off' | 'usage' | 'entry' | 'ua';
  dataUriLimit?: number;
  templateParameters?: Record<string, unknown>;
  crossorigin?: boolean | CrossOrigin;
  cssModuleLocalIdentName?: string;
  disableNodePolyfill?: boolean;
  enableTsLoader?: boolean;

  /**
   * The configuration of `output.ssg` is provided by `ssg` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `ssg` plugin
   */
  ssg?: SSGConfig;
};
