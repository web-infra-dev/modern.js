import type { OutputConfig, SourceConfig } from '@modern-js/core/config';
import type { ImportStyleType } from '@modern-js/babel-preset-module';
import type { NormalizedConfig } from '@modern-js/core';
import type { UserConfig } from '@speedy-js/speedy-core';
import type { LoggerText } from './features/build/logger/logText';
import type { Platform } from './features/build/build-platform';

export type { Platform } from './features/build/build-platform';
export type { ITsconfig } from './utils/tsconfig';

export interface ITaskMapper {
  logger: LoggerText | null;
  taskPath: string;
  params?: string[];
}

export type PackageModeType =
  | 'universal-js'
  | 'universal-js-lite'
  | 'browser-js'
  | 'browser-js-lite'
  | 'node-js';

export type JsSyntaxType = 'CJS+ES6' | 'ESM+ES5' | 'ESM+ES6';

export interface IPackageFields {
  main?: JsSyntaxType;
  modern?: JsSyntaxType;
  module?: JsSyntaxType;
}

export interface IBuildConfig {
  appDirectory: string;
  platform: boolean | Exclude<Platform, 'all'>;
  enableTscCompiler: boolean;
  enableWatchMode?: boolean;
  isTsProject: boolean;
  sourceDir: string;
  tsconfigName?: string;
  clear?: boolean;
  styleOnly?: boolean;
  outputPath: string;
}

export interface IPackageModeValue {
  type: 'module' | 'commonjs';
  syntax: 'es5' | 'es6+';
  outDir: 'node' | 'treeshaking' | 'modern';
  copyDirs?: ('node' | 'treeshaking' | 'modern')[];
}

export interface ModuleToolsOutput extends OutputConfig {
  assetsPath: string;
  disableTsChecker: boolean;
  enableSourceMap: boolean;
  packageMode: PackageModeType;
  packageFields: IPackageFields;
  importStyle: ImportStyleType;
}

export interface ModuleToolsSource extends SourceConfig {
  jsxTransformRuntime: 'automatic' | 'classic';
}

export type ModuleToolsConfig = NormalizedConfig & {
  output: OutputConfig & ModuleToolsOutput;
  source: NormalizedConfig['source'] & ModuleToolsSource;
};

export type TaskBuildConfig = IBuildConfig & NormalizedBuildConfig;
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
  speedyOption?: UserConfig;
};

export type BuildConfig = {
  format?: Format[];
  target?: Target;
  bundle?: boolean;
  bundleOption?: BundleOption;
  tsconfig?: string;
  watch?: boolean;
  dts?: boolean;
};

export type NormalizedBuildConfig = Required<BuildConfig> & {
  bundleOption: Required<BundleOption>;
};

export type BuildPreset = BuildConfig[] | BuildConfig | 'library' | 'component';

declare module '@modern-js/core' {
  // interface OutputConfig {
  //   assetsPath: string;
  //   enableSourceMap: boolean;
  //   importStyle: ImportStyleType;
  //   packageMode: PackageModeType;
  //   packageFields: IPackageFields;
  // }
  // interface SourceConfig {
  //   jsxTransformRuntime: 'automatic' | 'classic';
  // }

  interface NormalizedConfig {
    buildPreset?: BuildPreset;
  }
}
