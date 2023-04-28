// reference '../../../packages/solutions/module-tools/src/constants/build-presets.ts'
/**
 * @typedef {import('../../../packages/solutions/module-tools').PartialBaseBuildConfig} PartialBaseBuildConfig
 */

const externalHelpers = true;

/**
 * @type {PartialBaseBuildConfig[]}
 */
const nodeBuildConfig = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    dts: false,
    outDir: './dist/cjs',
    externalHelpers,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es2019',
    dts: false,
    outDir: './dist/esm',
    externalHelpers,
  },
  {
    buildType: 'bundleless',
    dts: {
      only: true,
    },
    outDir: './dist/types',
  },
];

/**
 * @param {PartialBaseBuildConfig} extendConfig
 * @returns {PartialBaseBuildConfig[]}
 */
const extendNodeBuildConfig = extendConfig => {
  return nodeBuildConfig.map(config => {
    return {
      ...config,
      ...extendConfig,
    };
  });
};

/**
 * @type {PartialBaseBuildConfig[]}
 */
const universalBuildConfig = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    dts: false,
    outDir: './dist/cjs',
    externalHelpers,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    dts: false,
    outDir: './dist/esm',
    externalHelpers,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es2019',
    dts: false,
    outDir: './dist/esm-node',
    externalHelpers,
  },
  {
    buildType: 'bundleless',
    dts: {
      only: true,
    },
    outDir: './dist/types',
  },
];

/**
 * @type {PartialBaseBuildConfig[]}
 */
const universalBuildConfigWithBundle = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    dts: false,
    outDir: './dist/cjs',
    externalHelpers,
  },
  {
    buildType: 'bundle',
    format: 'esm',
    target: 'es5',
    dts: false,
    outDir: './dist/esm',
    externalHelpers,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es2019',
    dts: false,
    outDir: './dist/esm-node',
    externalHelpers,
  },
  {
    buildType: 'bundleless',
    dts: {
      only: true,
    },
    outDir: './dist/types',
    externalHelpers,
  },
];

/**
 *
 * @param {PartialBaseBuildConfig} extendConfig
 * @returns {PartialBaseBuildConfig[]}
 */
const extendUniversalBuildConfig = extendConfig => {
  return nodeBuildConfig.map(config => {
    return {
      ...config,
      ...extendConfig,
    };
  });
};

module.exports = {
  nodeBuildConfig,
  extendNodeBuildConfig,
  universalBuildConfig,
  extendUniversalBuildConfig,
  universalBuildConfigWithBundle,
};
