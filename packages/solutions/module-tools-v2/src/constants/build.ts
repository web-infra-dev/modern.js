import { chalk } from '@modern-js/utils';
import type { BaseBuildConfig } from '../types';

export const buildingText = chalk.blue('Building...');
export const buildSuccessText = chalk.green('Build succeed');
export const buildFailText = chalk.red('Build Failed:');

export const defaultBundleBuildConfig: BaseBuildConfig = {
  buildType: 'bundle',
  format: 'cjs',
  target: 'esnext',
  // TODO: getDefaultEntry
  sourceMap: false,
  copy: {},
  path: './dist',
  dts: {
    only: false,
    distPath: './',
    tsconfigPath: './tsconfig.json',
  },
  bundleOptions: {
    entry: [], // entry will overrides by getDefaultEntry function
    platform: 'node',
    splitting: false,
    externals: undefined,
    minify: 'esbuild',
    skipDeps: true,
    assets: undefined,
    entryNames: '[name]',
    globals: {},
    metafile: false,
    jsx: 'automatic',
    getModuleId: () => undefined,
  },
};

export const defaultBundlelessBuildConfig: BaseBuildConfig = {
  buildType: 'bundleless',
  format: 'cjs',
  target: 'esnext',
  sourceMap: false,
  copy: {},
  path: './dist',
  dts: {
    distPath: './',
    tsconfigPath: './tsconfig.json',
    only: false,
  },
  bundlelessOptions: {
    sourceDir: './src',
    style: {
      path: './',
      compileMode: 'all',
    },
    assets: { path: './' },
  },
};
