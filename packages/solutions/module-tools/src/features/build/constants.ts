import { BuildConfig } from '../../schema/types';
import {
  NormalizedBuildConfig,
  NormalizedBundlelessBuildConfig,
} from './types';

// Universal JS 的默认选择，三份构建产物，支持 Node.js，对现代浏览器有优化
const universalJs: Pick<
  NormalizedBundlelessBuildConfig,
  'format' | 'target' | 'outputPath'
>[] = [
  { format: 'esm', target: 'es5', outputPath: './js/treeshaking' },
  { format: 'cjs', target: 'es6', outputPath: './js/node' },
  { format: 'esm', target: 'es6', outputPath: './js/modern' },
];

// Universal JS 的优化选择，两份构建产物，对现代浏览器无优化
const universalJsLite: Pick<
  NormalizedBundlelessBuildConfig,
  'format' | 'target' | 'outputPath'
>[] = [
  { format: 'esm', target: 'es5', outputPath: './js/treeshaking' },
  { format: 'cjs', target: 'es6', outputPath: './js/node' },
  { format: 'cjs', target: 'es6', outputPath: './js/modern' },
];

// 纯前端代码的默认选择，两份构建产物
const browserJs: Pick<
  NormalizedBundlelessBuildConfig,
  'format' | 'target' | 'outputPath'
>[] = [
  { format: 'esm', target: 'es5', outputPath: './js/treeshaking' },
  { format: 'esm', target: 'es5', outputPath: './js/node' },
  { format: 'esm', target: 'es6', outputPath: './js/modern' },
];

// 纯前端代码的优化选择，单份构建产物，对现代浏览器无优化
const browserJsLite: Pick<
  NormalizedBundlelessBuildConfig,
  'format' | 'target' | 'outputPath'
>[] = [{ format: 'esm', target: 'es5', outputPath: './js/treeshaking' }];

// 纯 Node.js 代码的默认选择，两份构建产物
const nodeJs: Pick<
  NormalizedBundlelessBuildConfig,
  'format' | 'target' | 'outputPath'
>[] = [
  { format: 'cjs', target: 'es6', outputPath: './js/node' },
  { format: 'esm', target: 'es6', outputPath: './js/modern' },
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

export const defaultLibraryPreset: BuildConfig[] = [
  {
    format: 'cjs',
    target: 'esnext',
    bundle: true,
    bundleOption: {
      entry: { index: './src/index.ts' },
    },
    tsconfig: 'tsconfig.json',
    dts: true,
    outputPath: './',
  },
];
export const defaultComponentPreset: BuildConfig[] = [
  {
    format: 'iife',
    target: 'esnext',
    bundle: true,
    bundleOption: {
      entry: { index: './src/index.ts' },
    },
    tsconfig: 'tsconfig.json',
    dts: true,
    outputPath: './',
  },
  {
    format: 'esm',
    target: 'esnext',
    bundle: false,
    bundleOption: {
      entry: { index: './src/index.ts' },
    },
    tsconfig: 'tsconfig.json',
    dts: true,
    outputPath: './es',
  },
  {
    format: 'cjs',
    target: 'esnext',
    bundle: false,
    bundleOption: {
      entry: { index: './src/index.ts' },
    },
    tsconfig: 'tsconfig.json',
    dts: true,
    outputPath: './lib',
  },
];

export const defaultBundleDirname = 'bundle';
export const defaultBundlessDirname = 'bundless';
