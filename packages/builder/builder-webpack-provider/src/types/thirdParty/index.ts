import type WebpackChain from '@modern-js/builder-shared/webpack-5-chain';
import type webpack from 'webpack';
import type { Configuration as WebpackConfig, LoaderContext } from 'webpack';
import type TerserPlugin from 'terser-webpack-plugin';
import type CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import type ForkTSCheckerPlugin from 'fork-ts-checker-webpack-plugin';
import type { Options as RawTSLoaderOptions } from 'ts-loader';
import type {
  Options as SassOptions,
  LegacyOptions as LegacySassOptions,
} from '../../../compiled/sass';
import type * as SassLoader from '../../../compiled/sass-loader';
import type Less from '../../../compiled/less';

export type { BabelTransformOptions } from '@modern-js/types';
export type { InspectorPluginOptions } from '@modern-js/inspector-webpack-plugin';
export type { CopyPluginOptions } from './CopyWebpackPlugin';
export type { Options as HTMLPluginOptions } from 'html-webpack-plugin';
export type { Options as PugOptions } from '../../../compiled/pug';
export type { SubresourceIntegrityPluginOptions as SubresourceIntegrityOptions } from '../../../compiled/webpack-subresource-integrity';

export type TerserPluginOptions = TerserPlugin.BasePluginOptions &
  TerserPlugin.DefinedDefaultMinimizerAndOptions<TerserPlugin.TerserOptions>;

export type CssMinimizerPluginOptions = CssMinimizerPlugin.BasePluginOptions &
  CssMinimizerPlugin.DefinedDefaultMinimizerAndOptions<CssMinimizerPlugin.CssNanoOptionsExtended>;

export type { CssNanoOptions } from 'css-minimizer-webpack-plugin';

export type { BabelConfigUtils } from '@modern-js/babel-preset-app';

export type TSLoaderOptions = Partial<RawTSLoaderOptions>;

export type ForkTSCheckerOptions = ConstructorParameters<
  typeof ForkTSCheckerPlugin
>[0];

export type { webpack, WebpackChain, WebpackConfig };

export type {
  CSSLoaderOptions,
  StyleLoaderOptions,
  CSSExtractOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  MiniCSSExtractPluginOptions,
  MiniCSSExtractLoaderOptions,
} from './css';

export type SassLoaderOptions = Omit<SassLoader.Options, 'sassOptions'> &
  (
    | {
        api?: 'legacy';
        sassOptions?: Partial<LegacySassOptions<'async'>>;
      }
    | {
        api: 'modern';
        sassOptions?: SassOptions<'async'>;
      }
  );

export type LessLoaderOptions = {
  lessOptions?: Less.Options;
  additionalData?:
    | string
    | ((
        content: string,
        loaderContext: LoaderContext<LessLoaderOptions>,
      ) => string);
  sourceMap?: boolean;
  webpackImporter?: boolean;
  implementation?: unknown;
};
