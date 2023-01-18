import type {
  PartialBuildConfig,
  PartialBaseBuildConfig,
  Target,
} from '../types';

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

export const basePresetConfig: PartialBuildConfig = {
  format: 'esm',
  target: 'es6',
  buildType: 'bundle',
  outDir: './dist',
  dts: { distPath: './types' },
};

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
  'base-config': basePresetConfig,
  NPM_LIBRARY: npmLibraryPresetConfig,
  'npm-library': npmLibraryPresetConfig,
  NPM_LIBRARY_WITH_UMD: npmLibraryWithUmdPresetConfig,
  'npm-library-with-umd': npmLibraryWithUmdPresetConfig,
  NPM_COMPONENT: npmComponentPresetConfig,
  'npm-component': npmComponentPresetConfig,
  NPM_COMPONENT_WITH_UMD: npmComponentWithUmdPresetConfig,
  'npm-component-with-umd': npmComponentWithUmdPresetConfig,
};
