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
  NormalizedBundlessBuildConfig,
} from './types';

const constants: typeof import('./constants') = Import.lazy(
  './constants',
  require,
);

export const getNormalizeModuleConfigByPackageModeAndFileds = (
  api: PluginAPI,
): NormalizedBuildConfig[] => {
  const {
    output: { packageMode, packageFields },
  } = api.useResolvedConfigContext();
  let configs: NormalizedBuildConfig[] = [];
  const commonConfig = {
    bundle: false,
    watch: false,
    dts: true,
    bundlessOption: {
      sourceDir: 'src',
    },
    tsconfig: './tsconfig.json',
  };
  // When both bundle and bundless products exist, they are distinguished by bundle and bundless directory names by default
  if (
    !packageFields ||
    (typeof packageFields === 'object' &&
      Object.keys(packageFields).length === 0)
  ) {
    const buildConfigs =
      constants.PACKAGE_MODES[packageMode || constants.DEFAULT_PACKAGE_MODE];
    configs = buildConfigs.map<NormalizedBundlessBuildConfig>(config => ({
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
          format: ['cjs'],
          target: 'es6',
          outputPath,
          ...commonConfig,
        };
      } else if (js === 'ESM+ES5') {
        return {
          format: ['esm'],
          target: 'es5',
          outputPath,
          ...commonConfig,
        };
      }

      return {
        format: ['esm'],
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

export const getFinalWatch = (
  config: BuildConfig,
  buildFeatOption: IBuildFeatOption,
) => {
  // cli watch option > buildPreset watch option
  if (buildFeatOption.enableWatchMode) {
    return buildFeatOption.enableWatchMode;
  }

  return config.watch ?? false;
};
export const getFinalTsconfig = (
  config: BuildConfig,
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
  config: BuildConfig,
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
): NormalizedBuildConfig[] => {
  const { buildFeatOption, api } = context;
  // If the user does not configure output.babelPreset,
  // the configuration is generated based on packageMode and packageField
  if (!preset) {
    return getNormalizeModuleConfigByPackageModeAndFileds(api);
  }

  if (preset === 'library') {
    return constants.defaultLibraryPreset;
  } else if (preset === 'component') {
    return constants.defaultComponentPreset;
  }
  // FIXME:throw error when preset is empty array
  const presetArray = Array.isArray(preset) ? preset : [preset];
  const mixedMode = checkMixedMode(presetArray);
  const normalizedModule = presetArray.map(config => {
    const format = config.format ?? ['esm', 'cjs'];
    const target = config.target ?? 'esnext';
    const bundle = config.bundle ?? false;
    const { bundleOption } = config;
    const normalizedBundleOption = {
      entry:
        bundleOption?.entry ??
        `src/index.${buildFeatOption.isTsProject ? 'ts' : 'js'}`,
      speedyOption: bundleOption?.speedyOption ?? {},
    };
    const normalizeBundlessOption = {
      sourceDir: './src',
      ...config.bundlessOption,
    };
    const watch = getFinalWatch(config, buildFeatOption);
    const tsconfig = getFinalTsconfig(config, buildFeatOption);
    const dts = getFinalDts(config, buildFeatOption);
    const outputPath =
      config.outputPath ?? getOutputPath({ mixedMode, bundle });

    return {
      format,
      target,
      bundle,
      bundleOption: normalizedBundleOption,
      bundlessOption: normalizeBundlessOption,
      watch,
      tsconfig,
      dts,
      outputPath,
    };
  });

  return normalizedModule;
};
