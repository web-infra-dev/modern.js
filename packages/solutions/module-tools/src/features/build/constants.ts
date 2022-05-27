import { NormalizedBuildConfig, NormalizedBundlessBuildConfig } from './types';

// Universal JS 的默认选择，三份构建产物，支持 Node.js，对现代浏览器有优化
const universalJs: Pick<
  NormalizedBundlessBuildConfig,
  'format' | 'target' | 'outputPath'
>[] = [
  { format: ['esm'], target: 'es5', outputPath: './js/treeshaking' },
  { format: ['cjs'], target: 'es6', outputPath: './js/node' },
  { format: ['esm'], target: 'es6', outputPath: './js/modern' },
];

// Universal JS 的优化选择，两份构建产物，对现代浏览器无优化
const universalJsLite: Pick<
  NormalizedBundlessBuildConfig,
  'format' | 'target' | 'outputPath'
>[] = [
  { format: ['esm'], target: 'es5', outputPath: './js/treeshaking' },
  { format: ['cjs'], target: 'es6', outputPath: './js/node' },
  { format: ['cjs'], target: 'es6', outputPath: './js/modern' },
];

// 纯前端代码的默认选择，两份构建产物
const browserJs: Pick<
  NormalizedBundlessBuildConfig,
  'format' | 'target' | 'outputPath'
>[] = [
  { format: ['esm'], target: 'es5', outputPath: './js/treeshaking' },
  { format: ['esm'], target: 'es5', outputPath: './js/node' },
  { format: ['esm'], target: 'es6', outputPath: './js/modern' },
];

// 纯前端代码的优化选择，单份构建产物，对现代浏览器无优化
const browserJsLite: Pick<
  NormalizedBundlessBuildConfig,
  'format' | 'target' | 'outputPath'
>[] = [{ format: ['esm'], target: 'es5', outputPath: './js/treeshaking' }];

// 纯 Node.js 代码的默认选择，两份构建产物
const nodeJs: Pick<
  NormalizedBundlessBuildConfig,
  'format' | 'target' | 'outputPath'
>[] = [
  { format: ['cjs'], target: 'es6', outputPath: './js/node' },
  { format: ['esm'], target: 'es6', outputPath: './js/modern' },
];

export const DEFAULT_PACKAGE_MODE = 'universal-js';

export const PACKAGE_MODES = {
  'universal-js': universalJs,
  'universal-js-lite': universalJsLite,
  'browser-js': browserJs,
  'browser-js-lite': browserJsLite,
  'node-js': nodeJs,
};

export const runBabelCompilerTitle = 'Run babel compiler code log';
export const runTscWatchTitle = 'Run `tsc -w` log';
export const runTscTitle = 'Run `tsc` log';
export const runStyleCompilerTitle = 'Run style compiler code log';
export const clearFlag = '\x1Bc';

export const defaultLibraryPreset: NormalizedBuildConfig[] = [
  {
    format: ['esm', 'cjs'],
    target: 'esnext',
    bundle: true,
    bundleOption: {
      entry: 'src/index.ts',
      speedyOption: {},
    },
    tsconfig: 'tsconfig.json',
    watch: false,
    dts: true,
    outputPath: './',
  },
];
export const defaultComponentPreset: NormalizedBuildConfig[] = [
  {
    format: ['esm', 'cjs', 'iife'],
    target: 'esnext',
    bundle: true,
    bundleOption: {
      entry: 'src/index.ts',
      speedyOption: {},
    },
    tsconfig: 'tsconfig.json',
    watch: false,
    dts: true,
    outputPath: './',
  },
];

export const defaultBundleDirname = 'bundle';
export const defaultBundlessDirname = 'bundless';
