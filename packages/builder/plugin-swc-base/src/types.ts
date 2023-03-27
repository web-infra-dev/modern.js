export interface Output {
  code: string;
  map?: string;
}

export type ICompiler = new (config: any) => CompilerInstance;

export interface CompilerInstance {
  transform: (filename: string, code: string, map?: string) => Promise<Output>;
  [prop: string]: any;
}

export type JsMinifyOptions = any;
export interface CssMinifyOptions {
  sourceMap?: boolean;
  inlineSourceContent?: boolean;
}

export type MinifyJs = (
  filename: string,
  code: string,
  config: any,
) => Promise<Output>;

export type MinifyCss = (
  filename: string,
  code: string,
  config: any,
) => Promise<Output>;

export interface PluginSwcOptions {
  presetReact?: Record<string, any>;
  presetEnv?: Record<string, any>;

  jsMinify?: boolean | Record<string, any>;
  cssMinify?: boolean | CssMinifyOptions;

  extensions?: Record<string, any>;
}

export interface TransformConfig {
  cwd?: string;
  env?: Record<string, any>;
  extensions?: Record<string, any>;
  [props: string]: any;
}
