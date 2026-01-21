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
    target: 'es2019',
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
    autoExtension: true,
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
  autoExternal: false,
  dts: false,
  sideEffects: false,
};

const generatorBuildUmdConfig = {
  format: 'umd',
  autoExternal: false,
  dts: false,
  umdGlobals: {
    '@modern-js/codesmith': 'codesmith',
    '@modern-js/codesmith-api-app': 'codesmithApiApp',
    '@modern-js/codesmith-api-git': 'codesmithApiGit',
    '@modern-js/codesmith-api-npm': 'codesmithApiNpm',
    '@modern-js/codesmith-api-ejs': 'codesmithApiEjs',
    '@modern-js/codesmith-api-fs': 'codesmithApiFs',
    '@modern-js/codesmith-api-handlebars': 'codesmithApiHandlebars',
    '@modern-js/codesmith-api-json': 'codesmithApiJson',
    '@modern-js/codesmith-formily': 'codesmithFormily',
    '@modern-js/codesmith-utils': 'codesmithUtils',
    '@modern-js/codesmith-utils/lodash': 'codesmithLodashUtils',
    '@modern-js/codesmith-utils/glob': 'codesmithGlobUtils',
    '@modern-js/codesmith-utils/fs-extra': 'codesmithFsUtils',
    '@modern-js/codesmith-utils/chalk': 'codesmithChalkUtils',
    '@modern-js/codesmith-utils/execa': 'codesmithExecaUtils',
    '@modern-js/codesmith-utils/npm': 'codesmithNpmUtils',
    '@modern-js/codesmith-utils/ora': 'codesmithOraUtils',
    '@modern-js/codesmith-utils/semver': 'codesmithSemverUtils',
    '@modern-js/i18n-utils': 'pluginI18N',
  },
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
  generatorBuildUmdConfig,
};
