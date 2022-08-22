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
  distPath?: string | DistPathConfig;
  polyfill?: Polyfill;
  assetPrefix?: string;
  dataUriLimit?: number;
  disableMinimize?: boolean;
  disableSourceMap?: boolean;
  disableFilenameHash?: boolean;
  enableAssetManifest?: boolean;
  enableLatestDecorators?: boolean;
  enableCssModuleTSDeclaration?: boolean;
  svgDefaultExport?: 'component' | 'url';
}
