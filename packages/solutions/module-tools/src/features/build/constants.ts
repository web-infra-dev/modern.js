import type { IPackageModeValue } from '../../types';

// Universal JS 的默认选择，三份构建产物，支持 Node.js，对现代浏览器有优化
const universalJs: IPackageModeValue[] = [
  { type: 'module', syntax: 'es5', outDir: 'treeshaking' },
  { type: 'commonjs', syntax: 'es6+', outDir: 'node' },
  { type: 'module', syntax: 'es6+', outDir: 'modern' },
];

// Universal JS 的优化选择，两份构建产物，对现代浏览器无优化
const universalJsLite: IPackageModeValue[] = [
  { type: 'module', syntax: 'es5', outDir: 'treeshaking' },
  { type: 'commonjs', syntax: 'es6+', outDir: 'node', copyDirs: ['modern'] },
];

// 纯前端代码的默认选择，两份构建产物
const browserJs: IPackageModeValue[] = [
  { type: 'module', syntax: 'es5', outDir: 'treeshaking', copyDirs: ['node'] },
  { type: 'module', syntax: 'es6+', outDir: 'modern' },
];

// 纯前端代码的优化选择，单份构建产物，对现代浏览器无优化
const browserJsLite: IPackageModeValue[] = [
  {
    type: 'module',
    syntax: 'es5',
    outDir: 'treeshaking',
    copyDirs: ['modern', 'node'],
  },
];

// 纯 Node.js 代码的默认选择，两份构建产物
const nodeJs: IPackageModeValue[] = [
  { type: 'commonjs', syntax: 'es6+', outDir: 'node' },
  { type: 'module', syntax: 'es6+', outDir: 'modern' },
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
