import type { PartialBaseBuildConfig, Target } from '../types';

export const targets: Target[] = [
  'es5',
  'es6',
  'es2015',
  'es2016',
  'es2017',
  'es2018',
  'es2019',
  'es2020',
  'es2021',
  'es2022',
  'esnext',
];

export const npmLibraryPresetConfig: PartialBaseBuildConfig[] = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    outDir: './dist/lib',
    dts: false,
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    outDir: './dist/es',
    dts: false,
  },
  {
    buildType: 'bundle',
    dts: { only: true, distPath: './types' },
  },
];
export const npmLibraryWithUmdPresetConfig: PartialBaseBuildConfig[] = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    outDir: './dist/lib',
    dts: false,
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    outDir: './dist/es',
    dts: false,
  },
  {
    format: 'umd',
    target: 'es6',
    platform: 'browser',
    buildType: 'bundle',
    outDir: './dist/umd',
    dts: false,
  },
  {
    buildType: 'bundle',
    dts: { only: true, distPath: './types' },
  },
];
export const npmComponentPresetConfig: PartialBaseBuildConfig[] = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outDir: './dist/lib',
    dts: false,
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    outDir: './dist/es',
    dts: false,
  },
  {
    buildType: 'bundleless',
    outDir: './dist/types',
    dts: { only: true },
  },
];
export const npmComponentWithUmdPresetConfig: PartialBaseBuildConfig[] = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outDir: './dist/lib',
    dts: false,
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    outDir: './dist/es',
    dts: false,
  },
  {
    format: 'umd',
    target: 'es6',
    platform: 'browser',
    buildType: 'bundle',
    outDir: './dist/umd',
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
}, {} as Record<`npm-library-${Target}`, PartialBaseBuildConfig[]>);

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
}, {} as Record<`npm-library-with-umd-${Target}`, PartialBaseBuildConfig[]>);

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
}, {} as Record<`npm-component-${Target}`, PartialBaseBuildConfig[]>);

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
}, {} as Record<`npm-component-with-umd-${Target}`, PartialBaseBuildConfig[]>);

export const nodeBuildConfig: PartialBaseBuildConfig[] = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    dts: false,
    externalHelpers: true,
    outDir: './dist/cjs',
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es2019',
    dts: false,
    externalHelpers: true,
    outDir: './dist/esm',
  },
  {
    buildType: 'bundleless',
    dts: {
      only: true,
    },
    outDir: './dist/types',
  },
];

export const universalBuildConfig: PartialBaseBuildConfig[] = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    dts: false,
    externalHelpers: true,
    outDir: './dist/cjs',
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    dts: false,
    externalHelpers: true,
    outDir: './dist/esm',
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es2019',
    dts: false,
    externalHelpers: true,
    outDir: './dist/esm-node',
  },
  {
    buildType: 'bundleless',
    dts: {
      only: true,
    },
    outDir: './dist/types',
  },
];

export const presetList: Record<string, PartialBaseBuildConfig[]> = {
  ...libraryPreset,
  ...libraryPresetWithTarget,
  ...libraryUmdPreset,
  ...libraryUmdPresetWithTarget,
  ...componentPreset,
  ...componentPresetWithTarget,
  ...componentUmdPreset,
  ...componentUmdPresetWithTarget,
  'modern-js-node': nodeBuildConfig,
  'modern-js-universal': universalBuildConfig,
};

export const internalPreset: Record<string, PartialBaseBuildConfig[]> = {
  NPM_LIBRARY: npmLibraryPresetConfig,
  'npm-library': npmLibraryPresetConfig,
  NPM_LIBRARY_WITH_UMD: npmLibraryWithUmdPresetConfig,
  'npm-library-with-umd': npmLibraryWithUmdPresetConfig,
  NPM_COMPONENT: npmComponentPresetConfig,
  'npm-component': npmComponentPresetConfig,
  NPM_COMPONENT_WITH_UMD: npmComponentWithUmdPresetConfig,
  'npm-component-with-umd': npmComponentWithUmdPresetConfig,
  'modern-js-node': nodeBuildConfig,
  'modern-js-universal': universalBuildConfig,
};
