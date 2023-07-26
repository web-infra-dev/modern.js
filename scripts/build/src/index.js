// reference '../../../packages/solutions/module-tools/src/constants/build-presets.ts'
/**
 * @typedef {import('../../../packages/solutions/module-tools').PartialBaseBuildConfig} PartialBaseBuildConfig
 */

const externalHelpers = true;
const skipDts = process.env.SKIP_DTS === 'true';
const dtsConfig = skipDts ? false : {};

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
  skipDts
    ? null
    : {
        buildType: 'bundleless',
        dts: {
          only: true,
        },
        outDir: './dist/types',
      },
].filter(Boolean);

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
  skipDts
    ? null
    : {
        buildType: 'bundleless',
        dts: {
          only: true,
        },
        outDir: './dist/types',
      },
].filter(Boolean);

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
  skipDts
    ? null
    : {
        buildType: 'bundleless',
        dts: {
          only: true,
        },
        outDir: './dist/types',
        externalHelpers,
      },
].filter(Boolean);

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

const tscLikeBuildConfig = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    outDir: './dist',
    externalHelpers,
    dts: dtsConfig,
  },
];

module.exports = {
  skipDts,
  dtsConfig,
  nodeBuildConfig,
  tscLikeBuildConfig,
  extendNodeBuildConfig,
  universalBuildConfig,
  extendUniversalBuildConfig,
  universalBuildConfigWithBundle,
};
