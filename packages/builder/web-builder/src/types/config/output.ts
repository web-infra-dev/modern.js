import type { MetaOptions } from '@modern-js/utils';
import type { CopyPluginOptions } from '../thirdParty';

export type DistPathConfig = {
  root?: string;
  js?: string;
  css?: string;
  svg?: string;
  font?: string;
  html?: string;
  image?: string;
  media?: string;
};

export type Polyfill = 'usage' | 'entry' | 'ua' | 'off';

export interface OutputConfig {
  copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
  meta?: MetaOptions;
  metaByEntries?: Record<string, MetaOptions>;
  title?: string;
  titleByEntries?: Record<string, string>;
  distPath?: string | DistPathConfig;
  polyfill?: Polyfill;
  assetPrefix?: string;
  dataUriLimit?: number;
  disableMinimize?: boolean;
  disableSourceMap?: boolean;
  disableHtmlFolder?: boolean;
  disableFilenameHash?: boolean;
  enableLatestDecorators?: boolean;
  enableCssModuleTSDeclaration?: boolean;
  templateParameters?: Record<string, unknown>;
  templateParametersByEntries?: Record<
    string,
    Record<string, unknown> | undefined
  >;
}
