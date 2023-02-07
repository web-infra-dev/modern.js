import type { PartialBaseBuildConfig } from '@modern-js/module-tools';

export const nodeBuildConfig: PartialBaseBuildConfig[] = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    dts: false,
    outDir: './dist/cjs',
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es2019',
    dts: false,
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

export const extendNodeBuildConfig = (
  extendConfig: PartialBaseBuildConfig,
): PartialBaseBuildConfig[] => {
  return nodeBuildConfig.map(config => {
    return {
      ...config,
      ...extendConfig,
    };
  });
};

export const universalBuildConfig: PartialBaseBuildConfig[] = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    dts: false,
    outDir: './dist/cjs',
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    dts: false,
    outDir: './dist/esm',
  },
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    dts: false,
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

export const extendUniversalBuildConfig = (
  extendConfig: PartialBaseBuildConfig,
): PartialBaseBuildConfig[] => {
  return nodeBuildConfig.map(config => {
    return {
      ...config,
      ...extendConfig,
    };
  });
};
