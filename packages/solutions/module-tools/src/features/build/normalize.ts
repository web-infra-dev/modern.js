import { Import } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type {
  BuildPreset,
  BuildConfig,
  JsSyntaxType,
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

export const getNormalizeModuleConfigByPackageModeAndFileds = (
  api: PluginAPI,
  buildFeatOption: IBuildFeatOption,
): NormalizedBuildConfig[] => {
  const {
    output: { packageMode, packageFields },
  } = api.useResolvedConfigContext();
  let configs: NormalizedBuildConfig[] = [];
  const commonConfig = {
    bundle: false,
    watch: false,
    dts: true,
    bundlelessOptions: {
      sourceDir: 'src',
    },
    tsconfig: './tsconfig.json',
    // Compatible field, to be removed in the next release, not visible to users
    ignoreSingleFormatDir: true,
    outputStylePath: 'js/styles',
  };

  commonConfig.watch = buildFeatOption.enableWatchMode || false;
  commonConfig.tsconfig = getFinalTsconfig(commonConfig, buildFeatOption);
  commonConfig.dts = getFinalDts(commonConfig, buildFeatOption);

  // When both bundle and bundless products exist, they are distinguished by bundle and bundless directory names by default
  if (
    !packageFields ||
    (typeof packageFields === 'object' &&
      Object.keys(packageFields).length === 0)
  ) {
    const buildConfigs =
      constants.PACKAGE_MODES[packageMode || constants.DEFAULT_PACKAGE_MODE];
    configs = buildConfigs.map<NormalizedBundlelessBuildConfig>(config => ({
      ...config,
      ...commonConfig,
    }));
  } else {
    const getConfigsByJsSyntaxType = (
      js: JsSyntaxType,
      outputPath: string,
    ): NormalizedBuildConfig => {
      if (js === 'CJS+ES6') {
        return {
          format: 'cjs',
          target: 'es6',
          outputPath,
          ...commonConfig,
        };
      } else if (js === 'ESM+ES5') {
        return {
          format: 'esm',
          target: 'es5',
          outputPath,
          ...commonConfig,
        };
      }

      return {
        format: 'esm',
        target: 'es6',
        outputPath,
        ...commonConfig,
      };
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

  return configs;
};

export const getOutputPath = (option: {
  mixedMode: boolean;
  bundle: boolean;
}) => {
  // When both bundle and bundless products exist,
  // they are distinguished by bundle and bundless directory names by default
  if (option.mixedMode) {
    return option.bundle
      ? constants.defaultBundleDirname
      : constants.defaultBundlessDirname;
  }

  return './';
};

export const checkMixedMode = (buildConfigs: BuildConfig[]) => {
  let bundle = false;
  let bundless = false;
  return buildConfigs.some(buildConfig => {
    if (buildConfig.bundle) {
      bundle = true;
    } else {
      bundless = true;
    }
    return bundle && bundless;
  });
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
  config: { dts?: boolean },
  buildFeatOption: IBuildFeatOption,
) => {
  if (!buildFeatOption.enableDtsGen) {
    return false;
  }

  return config.dts ?? true;
};

export const normalizeModuleConfig = (
  context: { buildFeatOption: IBuildFeatOption; api: PluginAPI },
  preset?: BuildPreset,
  config?: BuildConfig | BuildConfig[],
): NormalizedBuildConfig[] => {
  if (preset === 'library') {
    return constants.defaultLibraryPreset;
  } else if (preset === 'component') {
    return constants.defaultComponentPreset;
  }

  const { buildFeatOption, api } = context;
  // If the user does not configure output.babelPreset,
  // the configuration is generated based on packageMode and packageField
  if (!config) {
    return getNormalizeModuleConfigByPackageModeAndFileds(api, buildFeatOption);
  }

  // FIXME:throw error when preset is empty array
  const configArray = Array.isArray(config) ? config : [config];
  const mixedMode = checkMixedMode(configArray);
  const normalizedModule = configArray.map(config => {
    const format = config.format ?? 'cjs';
    const target = config.target ?? 'esnext';
    const bundle = config.bundle ?? false;
    const { bundleOptions } = config;
    const normalizedBundleOption = {
      ...bundleOptions,
      entry: bundleOptions?.entry || {
        index: `src/index.${buildFeatOption.isTsProject ? 'ts' : 'js'}`,
      },
      platform: bundleOptions?.platform || 'node',
    };
    const normalizeBundlelessOptions = {
      sourceDir: './src',
      ...config.bundlelessOptions,
    };
    const watch = buildFeatOption.enableWatchMode || false;
    const tsconfig = getFinalTsconfig(config, buildFeatOption);
    const dts = getFinalDts(config, buildFeatOption);
    const outputPath =
      config.outputPath ?? getOutputPath({ mixedMode, bundle });

    return {
      format,
      target,
      bundle,
      bundleOptions: normalizedBundleOption,
      bundlelessOptions: normalizeBundlelessOptions,
      watch,
      tsconfig,
      dts,
      outputPath,
    };
  });

  return normalizedModule;
};
