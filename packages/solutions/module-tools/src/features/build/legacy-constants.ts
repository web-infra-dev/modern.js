import { BuildConfig } from '../../schema/types';

// Universal JS 的默认选择，三份构建产物，支持 Node.js，对现代浏览器有优化
const universalJs: BuildConfig = [
  {
    format: 'esm',
    target: 'es5',
    outputPath: './js/treeshaking',
    bundlelessOptions: { style: { compileMode: 'only-source-code' } },
  },
  { format: 'cjs', target: 'es6', outputPath: './js/node' },
  { format: 'esm', target: 'es6', outputPath: './js/modern' },
];

// Universal JS 的优化选择，两份构建产物，对现代浏览器无优化
const universalJsLite: BuildConfig = [
  {
    format: 'esm',
    target: 'es5',
    outputPath: './js/treeshaking',
    bundlelessOptions: { style: { compileMode: 'only-source-code' } },
  },
  { format: 'cjs', target: 'es6', outputPath: './js/node' },
  { format: 'esm', target: 'es5', outputPath: './js/modern' },
];

// 纯前端代码的默认选择，两份构建产物
const browserJs: BuildConfig = [
  {
    format: 'esm',
    target: 'es5',
    outputPath: './js/treeshaking',
    bundlelessOptions: { style: { compileMode: 'only-source-code' } },
  },
  { format: 'esm', target: 'es6', outputPath: './js/node' },
  { format: 'esm', target: 'es6', outputPath: './js/modern' },
];

// 纯前端代码的优化选择，单份构建产物，对现代浏览器无优化
const browserJsLite: BuildConfig = [
  {
    format: 'esm',
    target: 'es5',
    outputPath: './js/treeshaking',
    bundlelessOptions: { style: { compileMode: 'only-source-code' } },
  },
  {
    format: 'esm',
    target: 'es5',
    outputPath: './js/node',
  },
  {
    format: 'esm',
    target: 'es5',
    outputPath: './js/modern',
  },
];

// 纯 Node.js 代码的默认选择，两份构建产物
const nodeJs: BuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    outputPath: './js/node',
    bundlelessOptions: { style: { compileMode: 'only-source-code' } },
  },
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
