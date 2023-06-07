import type {
  PluginOptions as MiniCSSExtractPluginOptions,
  LoaderOptions as MiniCSSExtractLoaderOptions,
} from 'mini-css-extract-plugin';

export interface CSSModulesOptions {
  compileType?: string;
  mode?: string;
  auto?: boolean | RegExp | ((resourcePath: string) => boolean);
  exportGlobals?: boolean;
  localIdentName?: string;
  localIdentContext?: string;
  localIdentHashPrefix?: string;
  namedExport?: boolean;
  exportLocalsConvention?: string;
  exportOnlyLocals?: boolean;
}

export interface CSSLoaderOptions {
  url?: boolean | ((url: string, resourcePath: string) => boolean);
  import?:
    | boolean
    | ((url: string, media: string, resourcePath: string) => boolean);
  modules?: boolean | string | CSSModulesOptions;
  sourceMap?: boolean;
  importLoaders?: number;
  esModule?: boolean;
}

export type StyleLoaderInjectType =
  | 'styleTag'
  | 'singletonStyleTag'
  | 'lazyStyleTag'
  | 'lazySingletonStyleTag'
  | 'linkTag';

export interface StyleLoaderOptions {
  injectType?: StyleLoaderInjectType;
  attributes?: Record<string, string>;
  insert?: string | ((element: HTMLElement) => void);
}

export { MiniCSSExtractPluginOptions, MiniCSSExtractLoaderOptions };

export interface CSSExtractOptions {
  pluginOptions?: MiniCSSExtractPluginOptions;
  loaderOptions?: MiniCSSExtractLoaderOptions;
}

export type NormalizedCSSExtractOptions = Required<CSSExtractOptions>;
