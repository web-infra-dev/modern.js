// reference '../../../packages/solutions/module-tools/src/constants/build-presets.ts'
/**
 * @typedef {import('../../../packages/solutions/module-tools').PartialBaseBuildConfig} PartialBaseBuildConfig
 */

const externalHelpers = true;
const transformLodash = true;
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
    transformLodash,
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
    transformLodash,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es5',
    dts: false,
    outDir: './dist/esm',
    externalHelpers,
    transformLodash,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es2019',
    dts: false,
    outDir: './dist/esm-node',
    externalHelpers,
    transformLodash,
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
    transformLodash,
  },
  {
    buildType: 'bundle',
    format: 'esm',
    target: 'es5',
    dts: false,
    outDir: './dist/esm',
    externalHelpers,
    transformLodash,
  },
  {
    buildType: 'bundleless',
    format: 'esm',
    target: 'es2019',
    dts: false,
    outDir: './dist/esm-node',
    externalHelpers,
    transformLodash,
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

const bundleConfig = {
  buildType: 'bundle',
  format: 'cjs',
  target: 'es2019',
  outDir: './dist',
  dts: skipDts
    ? false
    : {
        respectExternal: false,
      },
};

const tscLikeBuildConfig = [
  {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    outDir: './dist',
    externalHelpers,
    transformLodash,
    dts: dtsConfig,
  },
];

const generatorBuildConfig = {
  target: 'es2019',
  autoExternal: false,
  alias: {
    chalk: '@modern-js/utils/chalk',
  },
  dts: false,
  externals: [
    '@modern-js/utils',
    '@modern-js/utils/lodash',
    '@modern-js/utils/fs-extra',
    '@modern-js/utils/chalk',
  ],
};

module.exports = {
  skipDts,
  bundleConfig,
  dtsConfig,
  nodeBuildConfig,
  tscLikeBuildConfig,
  extendNodeBuildConfig,
  universalBuildConfig,
  extendUniversalBuildConfig,
  universalBuildConfigWithBundle,
  generatorBuildConfig,
};
