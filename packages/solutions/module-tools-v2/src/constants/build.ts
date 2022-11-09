import { chalk } from '@modern-js/utils';
import type {
  BaseBundleBuildConfig,
  BaseBundlelessBuildConfig,
  BundlelessOptions,
} from '../types';

export const buildingText = chalk.blue('Building...');
export const buildSuccessText = chalk.green('Build succeed');
export const buildFailText = chalk.red('Build Failed:');

export const defaultBundleBuildConfig = Object.freeze<BaseBundleBuildConfig>({
  buildType: 'bundle',
  format: 'cjs',
  target: 'esnext',
  // TODO: getDefaultEntry
  sourceMap: false,
  copy: {},
  path: './dist',
  dts: Object.freeze({
    only: false,
    distPath: './',
    tsconfigPath: './tsconfig.json',
  }),
  jsx: 'automatic',
  bundleOptions: {
    entry: [], // entry will overrides by getDefaultEntry function
    platform: 'node',
    splitting: false,
    externals: undefined,
    minify: false,
    skipDeps: true,
    entryNames: '[name]',
    globals: {},
    metafile: false,
    umdModuleName: undefined,
  },
});

export const defaultBundlelessBuildConfig =
  Object.freeze<BaseBundlelessBuildConfig>({
    buildType: 'bundleless',
    format: 'cjs',
    target: 'esnext',
    sourceMap: false,
    copy: {},
    path: './dist',
    dts: Object.freeze({
      distPath: './',
      tsconfigPath: './tsconfig.json',
      only: false,
    }),
    bundlelessOptions: Object.freeze<BundlelessOptions>({
      sourceDir: './src',
      styleCompileMode: 'only-compiled-code',
    }),
    jsx: 'automatic',
  });
