import { Import, lodash } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type {
  BuildConfig,
  JsSyntaxType,
  BaseBuildConfig,
  SourceMap,
} from '../../schema/types';
import type { IBuildFeatOption } from '../../types';
import { cliTsConfigDefaultValue } from '../../utils/constants';
import type {
  NormalizedBuildConfig,
  NormalizedBundlelessBuildConfig,
} from './types';

const constants: typeof import('./constants') = Import.lazy(
  './constants',
  require,
);

const legacyConstants: typeof import('./legacy-constants') = Import.lazy(
  './legacy-constants',
  require,
);

export const getNormalizeModuleConfigByPackageModeAndFileds = (
  api: PluginAPI,
  buildFeatOption: IBuildFeatOption,
): BuildConfig => {
  const {
    output: { packageMode, packageFields, disableTsChecker, importStyle },
  } = api.useResolvedConfigContext();
  let configs: BuildConfig = [];

  if (buildFeatOption.styleOnly) {
    configs.push({
      buildType: 'bundleless',
      outputPath: './js/styles',
      bundlelessOptions: {
        sourceDir: './src',
        style: {
          compileMode:
            importStyle === 'source-code' ? 'only-source-code' : 'all',
        },
      },
    });
    configs.push({
      buildType: 'bundleless',
      outputPath: './styles',
      bundlelessOptions: {
        sourceDir: './styles',
        style: { compileMode: 'only-compiled-code' },
      },
    });
    return configs;
  }

  const commonConfig: BaseBuildConfig = {
    buildType: 'bundleless',
    bundlelessOptions: {
      sourceDir: 'src',
      style: {
        path: '../styles',
        compileMode: false,
      },
      static: {
        path: '../styles',
      },
    },
    outputPath: './',
  };

  commonConfig.tsconfig = getFinalTsconfig(commonConfig, buildFeatOption);

  // When both bundle and bundleless products exist, they are distinguished by bundle and bundleless directory names by default
  if (
    !packageFields ||
    (typeof packageFields === 'object' &&
      Object.keys(packageFields).length === 0)
  ) {
    const buildConfigs =
      legacyConstants.PACKAGE_MODES[
        packageMode || legacyConstants.DEFAULT_PACKAGE_MODE
      ];
    configs = buildConfigs.map<NormalizedBundlelessBuildConfig>(config =>
      lodash.mergeWith({}, commonConfig, config),
    );
  } else {
    const getConfigsByJsSyntaxType = (
      js: JsSyntaxType,
      outputPath: string,
    ): NormalizedBuildConfig => {
      if (js === 'CJS+ES6') {
        return lodash.mergeWith({}, commonConfig, {
          format: 'cjs',
          target: 'es6',
          outputPath,
        });
      } else if (js === 'ESM+ES5') {
        return lodash.mergeWith({}, commonConfig, {
          format: 'esm',
          target: 'es5',
          outputPath,
        });
      }

      return lodash.mergeWith({}, commonConfig, {
        format: 'esm',
        target: 'es6',
        outputPath,
      });
    };
    if (!packageFields.modern && !packageFields.main && !packageFields.module) {
      throw new Error(
        `Unrecognized ${JSON.stringify(
          packageFields,
        )} configuration, please use keys: 'modern, main, jupiter:modern' and use values: 'CJS+ES6, ESM+ES5, ESM+ES6'`,
      );
    }
    // The fields configured in packageFields correspond to the main, module, and jsnext:modern fields on package.json,
    // and can also be used on package.json exports field.
    if (packageFields.modern) {
      configs.push(getConfigsByJsSyntaxType(packageFields.modern, 'modern'));
    }

    if (packageFields.main) {
      configs.push(getConfigsByJsSyntaxType(packageFields.main, 'node'));
    }

    if (packageFields.module) {
      configs.push(
        getConfigsByJsSyntaxType(packageFields.module, 'treeshaking'),
      );
    }
  }

  if (configs.length > 0) {
    const firstConfig = configs[0] as NormalizedBundlelessBuildConfig;
    firstConfig.bundlelessOptions = lodash.mergeWith(
      {},
      firstConfig.bundlelessOptions,
      {
        style: {
          compileMode:
            importStyle === 'source-code' ? 'only-source-code' : 'all',
        },
      },
    );
  }

  // [compatibe mode]: dts gen
  if (buildFeatOption.legacyTsc && !disableTsChecker) {
    configs.push({
      buildType: 'bundleless',
      outputPath: './types',
      enableDts: true,
      dtsOnly: true,
    });
  }

  configs.push({
    buildType: 'bundleless',
    outputPath: './styles',
    bundlelessOptions: {
      sourceDir: './styles',
      style: { compileMode: 'only-compiled-code' },
    },
  });

  return configs;
};

export const getFinalTsconfig = (
  config: { tsconfig?: string },
  buildFeatOption: IBuildFeatOption,
) => {
  // cli tsconfig option > buildPreset tsconfig option

  // Since tsconfig configuration has default values,
  // compare the two to see if the user is configured with cli tsconfig
  if (buildFeatOption.tsconfigName !== cliTsConfigDefaultValue) {
    return buildFeatOption.tsconfigName;
  }
  return config.tsconfig ?? 'tsconfig.json';
};
export const getFinalDts = (
  config: Pick<BaseBuildConfig, 'enableDts'>,
  buildFeatOption: IBuildFeatOption,
) => {
  // when `build --dts`, then all build tasks`s enableDts is true
  if (buildFeatOption.enableDtsGen) {
    return true;
  }

  return config.enableDts ?? false;
};
export const getSourceMap = (
  config: Pick<BaseBuildConfig, 'sourceMap'>,
  buildType: BaseBuildConfig['buildType'],
  api: PluginAPI,
): SourceMap => {
  // TODO: remove
  const {
    output: { disableSourceMap },
  } = api.useResolvedConfigContext();
  if (disableSourceMap) {
    return false;
  }

  if (config.sourceMap !== undefined) {
    return config.sourceMap;
  }

  return buildType === 'bundle';
};

export const normalizeModuleConfig = (context: {
  buildFeatOption: IBuildFeatOption;
  api: PluginAPI;
}): NormalizedBuildConfig[] => {
  const { buildFeatOption, api } = context;
  const {
    output: { buildConfig, buildPreset },
  } = api.useResolvedConfigContext();

  if (buildConfig) {
    return normalizeBuildConfig(context, buildConfig);
  }

  if (buildPreset) {
    const { unPresetConfigs, unPresetWithTargetConfigs } = constants;
    if (unPresetConfigs[buildPreset]) {
      return normalizeBuildConfig(context, unPresetConfigs[buildPreset]);
    } else if (unPresetWithTargetConfigs[buildPreset]) {
      return normalizeBuildConfig(
        context,
        unPresetWithTargetConfigs[buildPreset],
      );
    }

    // If the buildPreset is not found, then it is used 'npm-library'
    return normalizeBuildConfig(context, unPresetConfigs['npm-library']);
  }

  // If the user does not configure output.babelPreset,
  // the configuration is generated based on packageMode and packageField
  const legacyBuildConfig = getNormalizeModuleConfigByPackageModeAndFileds(
    api,
    buildFeatOption,
  );
  return normalizeBuildConfig(context, legacyBuildConfig);
};

export const normalizeBuildConfig = (
  context: { buildFeatOption: IBuildFeatOption; api: PluginAPI },
  buildConfig: BuildConfig,
): NormalizedBuildConfig[] => {
  const { buildFeatOption, api } = context;

  // FIXME:throw error when preset is empty array
  const configArray = Array.isArray(buildConfig) ? buildConfig : [buildConfig];
  const normalizedModule: NormalizedBuildConfig[] = configArray.map(config => {
    const format = config.format ?? 'cjs';
    const target = config.target ?? 'esnext';
    const { bundleOptions } = config;
    const normalizedBundleOption = {
      ...bundleOptions,
      entry: bundleOptions?.entry || {
        index: `src/index.${buildFeatOption.isTsProject ? 'ts' : 'js'}`,
      },
      platform: bundleOptions?.platform || 'node',
      minify: bundleOptions?.minify ?? false,
    };
    const normalizeBundlelessOptions = {
      sourceDir: './src',
      ...config.bundlelessOptions,
    };
    const watch = buildFeatOption.enableWatchMode || false;
    const tsconfig = getFinalTsconfig(config, buildFeatOption);
    const enableDts = getFinalDts(config, buildFeatOption);
    const outputPath = config.outputPath ?? './';
    const sourceMap = getSourceMap(config, config.buildType, api);
    const commmonConfig = {
      format,
      target,
      watch,
      tsconfig,
      enableDts,
      outputPath,
      dtsOnly: config.dtsOnly ?? false,
      sourceMap,
    };
    if (config.buildType === 'bundle') {
      return {
        ...commmonConfig,
        buildType: 'bundle',
        bundleOptions: normalizedBundleOption,
      };
    } else {
      return {
        ...commmonConfig,
        buildType: 'bundleless',
        bundlelessOptions: normalizeBundlelessOptions,
      };
    }
  });

  return normalizedModule;
};
