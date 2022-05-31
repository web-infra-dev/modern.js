import type { UserConfig as SpeedyConfig } from '@speedy-js/speedy-core';

export type JsSyntaxType = 'CJS+ES6' | 'ESM+ES5' | 'ESM+ES6';

export interface PackageFields {
  main?: JsSyntaxType;
  modern?: JsSyntaxType;
  module?: JsSyntaxType;
}

export type PackageModeType =
  | 'universal-js'
  | 'universal-js-lite'
  | 'browser-js'
  | 'browser-js-lite'
  | 'node-js';

export type BuildPresetString = 'library' | 'component';

export type Format = 'esm' | 'cjs' | 'iife';
export type Target =
  | 'es6'
  | 'es5'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  | 'esnext';

export type BundleOption = {
  entry?: string;
  speedyOption?: SpeedyConfig;
};

export type BundlessOption = {
  sourceDir?: string;
};

export type BuildConfig = {
  format?: Format[];
  target?: Target;
  bundle?: boolean;
  bundleOption?: BundleOption;
  bundlessOption?: BundlessOption;
  tsconfig?: string;
  watch?: boolean;
  dts?: boolean;
  outputPath: string;
};
// UserConfig
export type BuildPreset = BuildConfig[] | BuildConfig | BuildPresetString;
