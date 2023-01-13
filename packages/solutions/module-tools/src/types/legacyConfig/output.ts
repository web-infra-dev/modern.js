import type { UserConfig as LibuildUserConfig } from '@modern-js/libuild';

export type LegacyBuildPreset =
  | 'npm-library'
  | 'npm-library-with-umd'
  | 'npm-component'
  | 'npm-component-with-umd';

export type LegacyFormat = 'esm' | 'cjs' | 'umd';
export type LegacyTarget =
  | 'es5'
  | 'es6'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  // The default target is esnext which means that by default, assume all of the latest JavaScript and CSS features are supported.
  | 'esnext';
export type LegacyBuildType = 'bundle' | 'bundleless';
export type LegacySourceMap = boolean | 'inline' | 'external';

export type LegacyBundleOptions = {
  entry?: Record<string, string>;
  platform?: LibuildUserConfig['platform'];
  splitting?: boolean;
  minify?: LibuildUserConfig['minify'];
  externals?: LibuildUserConfig['external'];
  skipDeps?: boolean;
  getModuleId?: (moduleName: string) => string | undefined;
};

export type LegacyBundlelessOptions = {
  sourceDir?: string;
  style?: {
    compileMode?:
      | 'all'
      | 'only-compiled-code'
      | /* may be will be deprecated */ 'only-source-code'
      | false;
    path?: string;
  };
  static?: {
    path?: string;
  };
};

export type LegacyBaseBuildConfig = {
  format?: LegacyFormat;
  target?: LegacyTarget;
  sourceMap?: LegacySourceMap;
  buildType?: LegacyBuildType;
  bundleOptions?: LegacyBundleOptions;
  bundlelessOptions?: LegacyBundlelessOptions;
  tsconfig?: string;
  enableDts?: boolean;
  dtsOnly?: boolean;
  outputPath?: string;
};

export type LegacyBuildConfig = LegacyBaseBuildConfig | LegacyBaseBuildConfig[];

export type JsSyntaxType = 'CJS+ES6' | 'ESM+ES5' | 'ESM+ES6';
export interface PackageFields {
  main?: JsSyntaxType;
  'jsnext:modern'?: JsSyntaxType;
  module?: JsSyntaxType;
}

export type OutputLegacyUserConfig = {
  jsPath?: string;
  path?: string;
  copy?: Array<Record<string, unknown> & { from: string }>;
  disableTsChecker?: boolean;
  /** @deprecated Use the `buildConfig.bundlelessOptions.static.path` instead . */
  assetsPath?: string;
  /** @deprecated Use the `buildConfig.sourceMap` instead */
  disableSourceMap?: boolean;
  buildPreset?: LegacyBuildPreset;
  buildConfig?: LegacyBuildConfig;
  importStyle?: 'source-code' | 'compiled-code';
  packageMode?:
    | 'universal-js'
    | 'universal-js-lite'
    | 'browser-js'
    | 'browser-js-lite'
    | 'node-js';
  packageFields?: PackageFields;
};
