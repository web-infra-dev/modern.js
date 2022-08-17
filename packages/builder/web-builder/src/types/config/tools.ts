import type { IStyledComponentOptions } from '@modern-js/babel-preset-app';
import type {
  TSLoaderOptions,
  BabelConfigUtils,
  TerserPluginOptions,
  ForkTSCheckerOptions,
  BabelTransformOptions,
  CssMinimizerPluginOptions,
  CSSLoaderOptions,
  StyleLoaderOptions,
  CssExtractOptions,
  AutoprefixerOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  LessLoaderOptions,
  SassLoaderOptions,
} from '../thirdParty';

export type ToolsTerserConfig =
  | TerserPluginOptions
  | ((options: TerserPluginOptions) => TerserPluginOptions | void);

export type ToolsMinifyCssConfig =
  | CssMinimizerPluginOptions
  | ((options: CssMinimizerPluginOptions) => CssMinimizerPluginOptions | void);

export type ToolsBabelConfig =
  | BabelTransformOptions
  | ((
      options: BabelTransformOptions,
      utils: BabelConfigUtils,
    ) => BabelTransformOptions);

export type ToolsTSLoaderOptions =
  | TSLoaderOptions
  | ((
      options: TSLoaderOptions,
      utils: {
        addIncludes: (items: string | RegExp | (string | RegExp)[]) => void;
        addExcludes: (items: string | RegExp | (string | RegExp)[]) => void;
      },
    ) => TSLoaderOptions | void);

export type ToolsForkTSCheckerConfig =
  | ForkTSCheckerOptions
  | ((options: ForkTSCheckerOptions) => ForkTSCheckerOptions | void);

export type ToolsStyledComponentConfig =
  | IStyledComponentOptions
  | ((options: IStyledComponentOptions) => IStyledComponentOptions | void);

export type ToolsCSSLoaderConfig =
  | CSSLoaderOptions
  | ((options: CSSLoaderOptions) => CSSLoaderOptions | void);

export type ToolsStyleLoaderConfig =
  | StyleLoaderOptions
  | ((options: StyleLoaderOptions) => StyleLoaderOptions | void);

export type ToolsCssExtractConfig =
  | CssExtractOptions
  | ((options: CssExtractOptions) => CssExtractOptions | void);

export type ToolsAutoprefixerConfig =
  | AutoprefixerOptions
  | ((options: AutoprefixerOptions) => AutoprefixerOptions | void);

export type ToolsPostCSSLoaderConfig =
  | PostCSSLoaderOptions
  | ((
      options: PostCSSLoaderOptions,
      utils: {
        addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void;
      },
    ) => PostCSSLoaderOptions | void);

export type ToolsLessConfig =
  | LessLoaderOptions
  | ((
      options: LessLoaderOptions,
      utils: { addExcludes: (excludes: RegExp | RegExp[]) => void },
    ) => LessLoaderOptions | void);

export type ToolsSassConfig =
  | SassLoaderOptions
  | ((
      options: SassLoaderOptions,
      utils: { addExcludes: (excludes: RegExp | RegExp[]) => void },
    ) => SassLoaderOptions | void);

export type DevServerConfig = {
  hot?: boolean;
};

export interface ToolsConfig {
  babel?: ToolsBabelConfig;
  terser?: ToolsTerserConfig;
  tsLoader?: ToolsTSLoaderOptions;
  tsChecker?: false | ForkTSCheckerOptions;
  devServer?: DevServerConfig;
  minifyCss?: ToolsMinifyCssConfig;
  styledComponents?: IStyledComponentOptions;
  cssLoader?: CSSLoaderOptions;
  styleLoader?: StyleLoaderOptions;
  cssExtract?: CssExtractOptions;
  postcss?: PostCSSLoaderOptions;
  autoprefixer?: AutoprefixerOptions;
  sass?: SassLoaderOptions;
  less?: LessLoaderOptions;
}
