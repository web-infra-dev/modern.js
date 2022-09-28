import { chalk } from '@modern-js/utils';
import type { PartialBuildConfig, Target, BaseBuildConfig } from '../types';

export const buildingText = chalk.blue('Building...');
export const buildSuccessText = chalk.green('Build succeed');
export const buildFailText = chalk.red('Build Failed:');

export const targets: Target[] = [
  'es5',
  'es6',
  'es2015',
  'es2016',
  'es2017',
  'es2018',
  'es2019',
  'es2020',
  'esnext',
];

export const npmLibraryPresetConfig: PartialBuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    path: './lib',
    dts: {
      distPath: './types',
    },
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    path: './es',
  },
];
export const npmLibraryWithUmdPresetConfig: PartialBuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    path: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    path: './es',
    dts: {
      distPath: '../types',
    },
  },
  {
    format: 'umd',
    target: 'es6',
    buildType: 'bundle',
    path: './umd',
  },
];
export const npmComponentPresetConfig: PartialBuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    path: './lib',
    dts: {
      distPath: '../types',
    },
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    path: './es',
  },
];
export const npmComponentWithUmdPresetConfig: PartialBuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    path: './lib',
    dts: {
      distPath: '../types',
    },
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    path: './es',
  },
  {
    format: 'umd',
    target: 'es6',
    buildType: 'bundle',
    path: './umd',
  },
];

export const libraryPreset = { 'npm-library': npmLibraryPresetConfig };
export const libraryPresetWithTarget = targets.reduce((ret, target) => {
  ret[`npm-library-${target}`] = libraryPreset['npm-library'].map(config => {
    return { ...config, target };
  });
  return ret;
}, {} as Record<`npm-library-${Target}`, PartialBuildConfig>);

export const libraryUmdPreset = {
  'npm-library-with-umd': npmLibraryWithUmdPresetConfig,
};
export const libraryUmdPresetWithTarget = targets.reduce((ret, target) => {
  ret[`npm-library-with-umd-${target}`] = libraryUmdPreset[
    'npm-library-with-umd'
  ].map(config => {
    return { ...config, target };
  });
  return ret;
}, {} as Record<`npm-library-with-umd-${Target}`, PartialBuildConfig>);

export const componentPreset = {
  'npm-component': npmComponentPresetConfig,
};
export const componentPresetWithTarget = targets.reduce((ret, target) => {
  ret[`npm-component-${target}`] = componentPreset['npm-component'].map(
    config => {
      return { ...config, target };
    },
  );
  return ret;
}, {} as Record<`npm-component-${Target}`, PartialBuildConfig>);

export const componentUmdPreset = {
  'npm-component-with-umd': npmComponentWithUmdPresetConfig,
};
export const componentUmdPresetWithTarget = targets.reduce((ret, target) => {
  ret[`npm-component-with-umd-${target}`] = componentUmdPreset[
    'npm-component-with-umd'
  ].map(config => {
    return { ...config, target };
  });
  return ret;
}, {} as Record<`npm-component-with-umd-${Target}`, PartialBuildConfig>);

export const presetList = {
  ...libraryPreset,
  ...libraryPresetWithTarget,
  ...libraryUmdPreset,
  ...libraryUmdPresetWithTarget,
  ...componentPreset,
  ...componentPresetWithTarget,
  ...componentUmdPreset,
  ...componentUmdPresetWithTarget,
};

export const BuildInPreset = {
  NPM_LIBRARY: npmLibraryPresetConfig,
  NPM_LIBRARY_WITH_UMD: npmLibraryWithUmdPresetConfig,
  NPM_COMPONENT: npmComponentPresetConfig,
  NPM_COMPONENT_WITH_UMD: npmComponentWithUmdPresetConfig,
};

export const defaultBundleBuildConfig: BaseBuildConfig = {
  buildType: 'bundle',
  format: 'cjs',
  target: 'esnext',
  // TODO: getDefaultEntry
  entry: ['./src/index'],
  sourceMap: false,
  copy: [],
  path: './dist',
  dts: {
    only: false,
    distPath: './types',
    tsconfigPath: './tsconfig.json',
  },
  bundleOptions: {
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
  // TODO: getDefaultEntry
  entry: ['./src'],
  sourceMap: false,
  copy: [],
  path: './dist',
  dts: {
    distPath: './types',
    tsconfigPath: './tsconfig.json',
    only: false,
  },
  bundlelessOptions: {
    style: {
      path: './',
      compileMode: 'all',
    },
    assets: { path: './' },
  },
};
