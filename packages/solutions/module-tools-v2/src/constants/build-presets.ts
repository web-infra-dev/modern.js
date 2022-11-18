import type { PartialBuildConfig, Target } from '../types';

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

export const basePresetConfig: PartialBuildConfig = {
  format: 'esm',
  target: 'es6',
  buildType: 'bundleless',
  path: './dist',
  dts: { distPath: './types' },
};

export const npmLibraryPresetConfig: PartialBuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    path: './dist/lib',
    dts: false,
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    path: './dist/es',
    dts: false,
  },
  {
    buildType: 'bundle',
    dts: { only: true, distPath: './types' },
  },
];
export const npmLibraryWithUmdPresetConfig: PartialBuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    path: './dist/lib',
    dts: false,
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    path: './dist/es',
    dts: false,
  },
  {
    format: 'umd',
    target: 'es6',
    buildType: 'bundle',
    path: './dist/umd',
    dts: false,
  },
  {
    buildType: 'bundle',
    dts: { only: true, distPath: './types' },
  },
];
export const npmComponentPresetConfig: PartialBuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    path: './dist/lib',
    dts: false,
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    path: './dist/es',
    dts: false,
  },
  {
    buildType: 'bundleless',
    path: './dist/types',
    dts: { only: true },
  },
];
export const npmComponentWithUmdPresetConfig: PartialBuildConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    path: './dist/lib',
    dts: false,
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    path: './dist/es',
    dts: false,
  },
  {
    format: 'umd',
    target: 'es6',
    buildType: 'bundle',
    path: './dist/umd',
    dts: false,
  },
  {
    buildType: 'bundleless',
    dts: { only: true, distPath: './types' },
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
  'base-config': basePresetConfig,
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
  BASE_CONFIG: basePresetConfig,
  NPM_LIBRARY: npmLibraryPresetConfig,
  NPM_LIBRARY_WITH_UMD: npmLibraryWithUmdPresetConfig,
  NPM_COMPONENT: npmComponentPresetConfig,
  NPM_COMPONENT_WITH_UMD: npmComponentWithUmdPresetConfig,
};
