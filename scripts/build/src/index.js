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
  // target: 'es2020',
  // autoExternal: {
  //   dependencies: true,
  // },
  // dts: false,
  // externals: ['bluebird', '@npmcli/run-script', 'lodash', 'inquirer'],
  format: 'umd',
  autoExternal: false,
  externals: [
    '@modern-js/codesmith',
    '@modern-js/codesmith-api-app',
    '@modern-js/codesmith-api-git',
    '@modern-js/codesmith-api-npm',
    '@modern-js/codesmith-api-ejs',
    '@modern-js/codesmith-api-fs',
    '@modern-js/codesmith-api-handlebars',
    '@modern-js/codesmith-api-json',
    '@modern-js/codesmith-formily',
    '@modern-js/codesmith-utils',
    '@modern-js/plugin-i18n',
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
