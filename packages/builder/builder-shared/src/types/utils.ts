export type JSONPrimitive = string | number | boolean | null | undefined;

export type JSONArray = Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export type ArrayOrNot<T> = T | T[];

export type PromiseOrNot<T> = T | Promise<T>;

export type NodeEnv = 'development' | 'production' | 'test';

export type ChainedConfig<Config, Utils = unknown> = ArrayOrNot<
  | Config
  | (keyof Utils extends never
      ? (config: Config) => Config | void
      : (config: Config, utils: Utils) => Config | void)
>;

export type DeepReadonly<T> = keyof T extends never
  ? T
  : { readonly [k in keyof T]: DeepReadonly<T[k]> };

export type FileFilterUtil = (items: ArrayOrNot<string | RegExp>) => void;

export type SharedCompiledPkgNames =
  | 'pug'
  | 'sass'
  | 'less'
  | 'css-loader'
  | 'postcss-loader'
  | 'postcss-pxtorem'
  | 'postcss-flexbugs-fixes'
  | 'postcss-custom-properties'
  | 'postcss-initial'
  | 'postcss-page-break'
  | 'postcss-font-variant'
  | 'postcss-media-minmax'
  | 'postcss-nesting'
  | 'autoprefixer'
  | 'sass-loader'
  | 'less-loader'
  | 'node-loader'
  | 'babel-loader'
  | 'file-loader'
  | 'url-loader'
  | 'toml-loader'
  | 'yaml-loader'
  | 'assetsRetry.js'
  | 'resolve-url-loader';

export type CompilerTapFn<
  CallBack extends (...args: any[]) => void = () => void,
> = {
  tap: (name: string, cb: CallBack) => void;
};
