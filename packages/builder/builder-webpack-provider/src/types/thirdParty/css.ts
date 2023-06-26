import type {
  PluginOptions as MiniCSSExtractPluginOptions,
  LoaderOptions as MiniCSSExtractLoaderOptions,
} from 'mini-css-extract-plugin';

export { MiniCSSExtractPluginOptions, MiniCSSExtractLoaderOptions };

export interface CSSExtractOptions {
  pluginOptions?: MiniCSSExtractPluginOptions;
  loaderOptions?: MiniCSSExtractLoaderOptions;
}

export type NormalizedCSSExtractOptions = Required<CSSExtractOptions>;
