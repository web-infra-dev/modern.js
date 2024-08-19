import type {
  AcceptedPlugin as PostCSSPlugin,
  ProcessOptions,
  Plugin,
} from 'postcss';
import type { Options as sassOptions } from '../../../compiled/sass';
import type Less from '../../../compiled/less';

type LocalsConventionFunction = (
  originalClassName: string,
  generatedClassName: string,
  inputFile: string,
) => string;

type GenerateScopedNameFunction = (
  name: string,
  filename: string,
  css: string,
) => string;

declare class Loader {
  finalSource?: string | undefined;
  constructor(root: string, plugins: Plugin[]);
  fetch(
    file: string,
    relativeTo: string,
    depTrace: string,
  ): Promise<{ [key: string]: string }>;
}

type AdditionalData = string | ((filePath: string) => string);

export type Modules = {
  localsConvention?:
    | 'camelCase'
    | 'camelCaseOnly'
    | 'dashes'
    | 'dashesOnly'
    | LocalsConventionFunction;
  scopeBehaviour?: 'global' | 'local';
  globalModulePaths?: RegExp[];
  generateScopedName?: string | GenerateScopedNameFunction;
  hashPrefix?: string;
  exportGlobals?: boolean;
  root?: string;
  resolve?: (file: string) => string | Promise<string>;
  Loader?: typeof Loader;
  getJSON?: (
    cssFilename: string,
    json: { [name: string]: string },
    outputFilename?: string,
  ) => void;
};

export type AutoModules = boolean | RegExp;

export type LessOptions = {
  additionalData?: AdditionalData;
  implementation?: object | string;
  lessOptions?: Less.Options;
};
export type SassOptions = {
  additionalData?: AdditionalData;
  implementation?: object | string;
  sassOptions?: sassOptions<'async'>;
};

export type PostcssOptions = {
  processOptions?: ProcessOptions;
  plugins?: PostCSSPlugin[];
};

export type LessConfig =
  | LessOptions
  | ((options: LessOptions) => LessOptions | void);

export type SassConfig =
  | SassOptions
  | ((options: SassOptions) => SassOptions | void);

export type PostCSSConfigUtils = {
  addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void;
};

export type PostCSSConfig =
  | PostcssOptions
  | ((
      options: PostcssOptions,
      utils: PostCSSConfigUtils,
    ) => PostcssOptions | void);

export type TailwindCSSConfig =
  | Record<string, any>
  | ((options: Record<string, any>) => Record<string, any> | void);

export interface Style extends Required<StyleConfig> {
  sass: SassOptions;
  less: LessOptions;
  postcss: PostcssOptions;
}

export interface StyleConfig {
  inject?: boolean;
  sass?: SassConfig;
  less?: LessConfig;
  postcss?: PostCSSConfig;
  autoModules?: boolean | RegExp;
  modules?: Modules;
  tailwindcss?: TailwindCSSConfig;
}
