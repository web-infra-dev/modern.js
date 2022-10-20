import type {
  SharedOutputConfig,
  NormalizedSharedOutputConfig,
} from '@modern-js/builder-shared';
import type { CopyPluginOptions, WebpackConfig } from '../thirdParty';

/**
 * postcss-pxtorem options
 * https://github.com/cuth/postcss-pxtorem#options
 */
export type PxToRemOptions = {
  rootValue?: number;
  unitPrecision?: number;
  propList?: Array<string>;
  selectorBlackList?: Array<string>;
  replace?: boolean;
  mediaQuery?: boolean;
  minPixelValue?: number;
  exclude?: string | RegExp | ((filePath: string) => boolean);
};

export type RemOptions = {
  /** Whether to inject runtime code into html templates。Default: true */
  enableRuntime?: boolean;
  /** Usually, `fontSize = (clientWidth * rootFontSize) / screenWidth` */
  screenWidth?: number;
  rootFontSize?: number;
  maxRootFontSize?: number;
  /** Get clientWidth from the url query based on widthQueryKey */
  widthQueryKey?: string;
  /** The entries to ignore */
  excludeEntries?: string[];
  /** Use height to calculate rem in landscape。Default: false */
  supportLandscape?: boolean;
  /** Whether to use rootFontSize when large than maxRootFontSize（scene：pc） */
  useRootFontSizeBeyondMax?: boolean;
  /** CSS (postcss-pxtorem) option */
  pxtorem?: PxToRemOptions;
};

export type ExternalsOptions = WebpackConfig['externals'];

export type OutputConfig = SharedOutputConfig & {
  copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
  convertToRem?: boolean | RemOptions;
  externals?: ExternalsOptions;
};

export type NormalizedOutputConfig = OutputConfig &
  NormalizedSharedOutputConfig;
