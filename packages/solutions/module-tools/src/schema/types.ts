import type { UserConfig as SpeedyConfig } from '@speedy-js/speedy-core';

export type Format = 'esm' | 'cjs' | 'umd';
export type Target =
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
export type BuildType = 'bundle' | 'bundleless';
export type SourceMap = boolean | 'inline' | 'external';

export type BundleOptions = {
  entry?: Record<string, string>;
  platform?: SpeedyConfig['platform'];
  splitting?: boolean;
  minify?: SpeedyConfig['minify'];
  externals?: SpeedyConfig['external'];
  skipDeps?: boolean;
};

export type BundlelessOptions = {
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

export type BaseBuildConfig = {
  format?: Format;
  target?: Target;
  sourceMap?: SourceMap;
  buildType?: BuildType;
  bundleOptions?: BundleOptions;
  bundlelessOptions?: BundlelessOptions;
  tsconfig?: string;
  enableDts?: boolean;
  dtsOnly?: boolean;
  outputPath?: string;
};

export type BuildConfig = BaseBuildConfig | BaseBuildConfig[];
export type BuildPreset =
  | 'npm-library'
  | 'npm-library-with-umd'
  | 'npm-component'
  | 'npm-component-with-umd';

// legacy config
export type JsSyntaxType = 'CJS+ES6' | 'ESM+ES5' | 'ESM+ES6';
export interface PackageFields {
  main?: JsSyntaxType;
  'jsnext:modern'?: JsSyntaxType;
  module?: JsSyntaxType;
}

export type PackageModeType =
  | 'universal-js'
  | 'universal-js-lite'
  | 'browser-js'
  | 'browser-js-lite'
  | 'node-js';
