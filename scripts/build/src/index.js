/**
 * @typedef {import('../../../packages/solutions/module-tools').PartialBaseBuildConfig} PartialBaseBuildConfig
 */

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
    format: 'esm',
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
};
