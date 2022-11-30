import { MetaOptions } from '@modern-js/utils';
import { SSGConfig } from '../config';

type CrossOrigin = 'anonymous' | 'use-credentials';

export type OutputLegacyUserConfig = {
  assetPrefix?: string;
  htmlPath?: string;
  jsPath?: string;
  cssPath?: string;
  mediaPath?: string;
  path?: string;
  title?: string;
  titleByEntries?: Record<string, string>;
  meta?: MetaOptions;
  metaByEntries?: Record<string, MetaOptions>;
  inject?: 'body' | 'head' | boolean;
  injectByEntries?: Record<string, 'body' | 'head' | boolean>;
  mountId?: string;
  favicon?: string;
  faviconByEntries?: Record<string, string | undefined>;
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
  templateParametersByEntries?: Record<string, Record<string, unknown>>;
  crossorigin?: boolean | CrossOrigin;
  cssModuleLocalIdentName?: string;
  enableModernMode?: boolean;
  disableNodePolyfill?: boolean;
  enableTsLoader?: boolean;

  /**
   * The configuration of `output.ssg` is provided by `ssg` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `ssg` plugin
   */
  ssg?: SSGConfig;
};
