import { BaseBuildConfig, Target } from '../../schema/types';

export const runBabelCompilerTitle = 'Run babel compiler code log';
export const runTscWatchTitle = 'Run `tsc -w` log';
export const runTscTitle = 'Run `tsc` log';
export const runStyleCompilerTitle = 'Run style compiler code log';
export const clearFlag = '\x1Bc';

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

export const npmLibraryPresetConfig: BaseBuildConfig[] = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './es',
  },
  {
    buildType: 'bundle',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
export const npmLibraryWithUmdPresetConfig: BaseBuildConfig[] = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './es',
  },
  {
    // format: 'umd',
    format: 'iife',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './umd',
  },
  {
    buildType: 'bundle',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
export const npmComponentPresetConfig: BaseBuildConfig[] = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    outputPath: './es',
  },
  {
    buildType: 'bundleless',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];
export const npmComponentWithUmdPresetConfig: BaseBuildConfig[] = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outputPath: './lib',
  },
  {
    format: 'esm',
    target: 'es6',
    buildType: 'bundleless',
    outputPath: './es',
  },
  {
    // format: 'umd',
    format: 'iife',
    target: 'es6',
    buildType: 'bundle',
    outputPath: './umd',
  },
  {
    buildType: 'bundleless',
    outputPath: './types',
    enableDts: true,
    dtsOnly: true,
  },
];

export const unPresetConfigs = {
  'npm-library': npmLibraryPresetConfig,
  'npm-library-with-umd': npmLibraryWithUmdPresetConfig,
  'npm-component': npmComponentPresetConfig,
  'npm-component-with-umd': npmComponentWithUmdPresetConfig,
};

export const unPresets = Object.keys(
  unPresetConfigs,
) as (keyof typeof unPresetConfigs)[];
export const unPresetWithTargetConfigs = unPresets.reduce<
  Record<string, BaseBuildConfig[]>
>((o, presetStr) => {
  const rets = targets.map(target => [
    `${presetStr}-${target}`.toLowerCase(),
    unPresetConfigs[presetStr].map(config => {
      return { ...config, target };
    }),
  ]);

  return {
    ...o,
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    ...Object.fromEntries(rets),
  };
}, {});

export const defaultBundleDirname = 'bundle';
export const defaultBundlessDirname = 'bundleless';
