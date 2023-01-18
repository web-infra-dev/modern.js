/* eslint-disable max-lines */
import path from 'path';
import type {
  ModuleUserConfig,
  ModuleToolsLegacyUserConfig,
  PartialBaseBuildConfig,
} from '../types';
import type { LegacyBaseBuildConfig } from '../types/legacyConfig/output';
import {
  PostCSSFunction,
  PostCSSLoaderOptions,
} from '../types/legacyConfig/tools';

/**
 * transform `tools` to buildConfig
 * include tools.less/sass/postcss/tailwindcss
 * @param buildConfig PartialBaseBuildConfig
 * @param legacyUserConfig Readonly<ModuleToolsLegacyUserConfig>
 */
export const transformToolsToBuildConfig = (
  buildConfig: PartialBaseBuildConfig,
  legacyUserConfig: Readonly<ModuleToolsLegacyUserConfig>,
) => {
  if (!legacyUserConfig.tools) {
    return;
  }
  const legacyTools = legacyUserConfig.tools;
  buildConfig.style = {
    ...(buildConfig.style ?? {}),
    less: legacyTools.less ?? {},
    sass: legacyTools.sass ?? {},
    tailwindcss: legacyTools.tailwindcss ?? {},
  };

  if (legacyTools.postcss) {
    buildConfig.style.postcss =
      typeof legacyTools.postcss === 'function'
        ? (opts, utils) => {
            const legacyOpts: PostCSSLoaderOptions = {
              postcssOptions: {
                plugins: opts.plugins,
              },
            };
            (legacyTools.postcss as PostCSSFunction)(legacyOpts, utils);
            opts.plugins = legacyOpts.postcssOptions?.plugins;
            opts.processOptions = legacyOpts.postcssOptions;
          }
        : {
            plugins: legacyTools.postcss.postcssOptions?.plugins,
            processOptions: legacyTools.postcss.postcssOptions,
          };
  }
};

/**
 * transform `source` to buildConfig
 *
 * @param buildConfig PartialBaseBuildConfig
 * @param legacyUserConfig Readonly<ModuleToolsLegacyUserConfig>
 *
 * NB: ignore source.designSystem in this function
 */
export const transformSourceToBuildConfig = (
  buildConfig: PartialBaseBuildConfig,
  legacyUserConfig: Readonly<ModuleToolsLegacyUserConfig>,
) => {
  if (!legacyUserConfig.source) {
    return;
  }
  const legacySource = legacyUserConfig.source;

  buildConfig.alias = legacySource.alias ?? {};

  buildConfig.define = {};
  legacySource.envVars?.forEach(envVar => {
    buildConfig.define![`process.env.${envVar}`] = process.env[
      envVar
    ] as string;
  });
  buildConfig.define = {
    ...buildConfig.define,
    ...legacySource.globalVars,
  };

  buildConfig.jsx =
    legacySource.jsxTransformRuntime === 'classic' ? 'transform' : 'automatic';
};

export const transformOutputToBuildConfig = (
  buildConfig: PartialBaseBuildConfig,
  legacyUserConfig: Readonly<ModuleToolsLegacyUserConfig>,
) => {
  if (legacyUserConfig.output?.disableTsChecker) {
    buildConfig.dts = false;
  }

  if (legacyUserConfig.output?.disableSourceMap) {
    buildConfig.sourceMap = false;
  }
};

export const commonTransformAndLog = async (
  legacyUserConfig: Readonly<ModuleToolsLegacyUserConfig>,
) => {
  const { logger } = await import('@modern-js/utils');
  const finalConfig: ModuleUserConfig = {};
  // source.designSystem
  finalConfig.designSystem = legacyUserConfig.source?.designSystem;

  if (legacyUserConfig.tools) {
    const legacyTools = legacyUserConfig.tools;
    if (legacyTools.babel) {
      logger.warn(
        '`tools.babel` is not support in legacy mode. Please check migrate documentation.',
      );
    }

    if (legacyTools.lodash) {
      logger.warn(
        '`tools.lodash` is not support in legacy mode. Please check migrate documentation.',
      );
    }

    if (legacyTools.jest) {
      finalConfig.testing = {
        jest: legacyTools.jest,
      };
    }
  }

  if (legacyUserConfig.output?.importStyle) {
    logger.warn(
      '`output.importStyle` is not support in legacy mode. Please check migrate documentation. By default, the style will be compiled',
    );
  }

  if (legacyUserConfig.output?.jsPath) {
    logger.warn('`output.jsPath` is not support in legacy mode.');
  }

  return finalConfig;
};

export const createConfigByBuildConfig = async (
  legacyUserConfig: Readonly<ModuleToolsLegacyUserConfig>,
): Promise<ModuleUserConfig> => {
  const { logger } = await import('@modern-js/utils');
  const legacyBuildConfig = legacyUserConfig.output!.buildConfig!;

  const createBuildConfig = (config: LegacyBaseBuildConfig) => {
    const newConfig: PartialBaseBuildConfig = {};

    transformSourceToBuildConfig(newConfig, legacyUserConfig);

    // [legacy config: output] start
    const legacyPath = legacyUserConfig.output?.path ?? 'dist';
    newConfig.outDir = path.join(legacyPath, config.outputPath ?? './');

    // `bundlelessOptions.static.path` is a higher priority than `output?.assetsPath`
    newConfig.asset = {
      path: legacyUserConfig.output?.assetsPath,
    };

    // `buildConfig.sourceMap` is a higher priority than `output?.disableSourceMap`
    newConfig.sourceMap = !legacyUserConfig.output?.disableSourceMap;
    newConfig.sourceMap = config.sourceMap ?? config.buildType === 'bundle';

    newConfig.buildType = config.buildType ?? 'bundleless';
    newConfig.format = config.format ?? 'cjs';
    newConfig.target = config.target ?? 'esnext';

    newConfig.dts = legacyUserConfig.output?.disableTsChecker ? false : {};
    if (config.dtsOnly) {
      newConfig.dts = {
        ...(typeof newConfig.dts === 'object' ? newConfig.dts : {}),
        only: true,
      };
    }
    if (config.tsconfig) {
      newConfig.dts = {
        ...(typeof newConfig.dts === 'object' ? newConfig.dts : {}),
        tsconfigPath: config.tsconfig,
      };
    }
    // check enableDts must be last
    if (!config.enableDts) {
      newConfig.dts = false;
    }

    if (config.bundleOptions) {
      const { bundleOptions } = config;
      if (bundleOptions.entry) {
        newConfig.input = config.bundleOptions.entry;
      }

      newConfig.splitting = bundleOptions.splitting ?? false;
      newConfig.platform = bundleOptions.platform ?? 'node';
      newConfig.minify = bundleOptions.minify ?? false;
      newConfig.externals = bundleOptions.externals ?? [];
      newConfig.autoExternal = bundleOptions.skipDeps ?? true;
    }

    if (config.bundlelessOptions) {
      const { bundlelessOptions } = config;
      newConfig.sourceDir = bundlelessOptions.sourceDir ?? './src';

      if (bundlelessOptions.style) {
        logger.warn(
          'bundlelessOptions.style is not support in legacy mode. Please check migrate documentation. By default, the style will be compiled.',
        );
      }

      // look the notes about `output?.assetsPath` above
      if (bundlelessOptions.static?.path) {
        newConfig.asset = {
          path: bundlelessOptions.static?.path,
        };
      }
    }

    if (legacyUserConfig.output?.importStyle) {
      logger.warn(
        '`output.importStyle` is not support in legacy mode. Please check migrate documentation. By default, the style will be compiled',
      );
    }

    if (legacyUserConfig.output?.jsPath) {
      logger.warn('`output.jsPath` is not support in legacy mode.');
    }
    // [legacy config: output] end

    if (legacyUserConfig.tools) {
      transformToolsToBuildConfig(newConfig, legacyUserConfig);
    }

    return newConfig;
  };

  const finalConfig: ModuleUserConfig = {};
  if (Array.isArray(legacyBuildConfig)) {
    finalConfig.buildConfig = legacyBuildConfig.map(config =>
      createBuildConfig(config),
    );
  } else {
    finalConfig.buildConfig = [createBuildConfig(legacyBuildConfig)];
  }

  // source.designSystem
  finalConfig.designSystem = legacyUserConfig.source?.designSystem;

  // output.copy
  if (legacyUserConfig.output?.copy) {
    finalConfig.buildConfig.push({
      copy: {
        patterns: legacyUserConfig.output.copy,
      },
    });
  }

  if (legacyUserConfig.tools) {
    const legacyTools = legacyUserConfig.tools;
    if (legacyTools.babel) {
      logger.warn(
        '`tools.babel` is not support in legacy mode. Please check migrate documentation.',
      );
    }

    if (legacyTools.lodash) {
      logger.warn(
        '`tools.lodash` is not support in legacy mode. Please check migrate documentation.',
      );
    }

    if (legacyTools.jest) {
      finalConfig.testing = {
        jest: legacyTools.jest,
      };
    }
  }

  return finalConfig;
};

export const createConfigByBuildPreset = async (
  legacyUserConfig: Readonly<ModuleToolsLegacyUserConfig>,
): Promise<ModuleUserConfig> => {
  const legacyBuildPreset = legacyUserConfig.output?.buildPreset;
  const finalConfig = await commonTransformAndLog(legacyUserConfig);

  return {
    ...finalConfig,
    buildPreset({ preset }) {
      const buildConfigs = preset[legacyBuildPreset ?? 'npm-library'];
      buildConfigs.forEach(buildConfig => {
        transformSourceToBuildConfig(buildConfig, legacyUserConfig);
        transformToolsToBuildConfig(buildConfig, legacyUserConfig);
        transformOutputToBuildConfig(buildConfig, legacyUserConfig);
      });
      // output.copy
      if (legacyUserConfig.output?.copy) {
        buildConfigs.push({
          copy: {
            patterns: legacyUserConfig.output.copy,
          },
        });
      }
      return buildConfigs;
    },
  };
};

export const createConfigByPackageFields = async (
  legacyUserConfig: Readonly<ModuleToolsLegacyUserConfig>,
): Promise<ModuleUserConfig> => {
  const finalConfig = await commonTransformAndLog(legacyUserConfig);

  const output = legacyUserConfig.output!;
  const packageFields = output.packageFields!;
  const buildConfigs: PartialBaseBuildConfig[] = [];

  const packageFieldsKeys = Object.keys(packageFields) as (
    | 'main'
    | 'jsnext:modern'
    | 'module'
  )[];

  for (const packageField of packageFieldsKeys) {
    const packageFieldValue = packageFields[packageField];
    let buildConfig: PartialBaseBuildConfig = {};
    let outDir;
    if (packageField === 'main') {
      outDir = `./${output.path ?? 'dist'}/js/node`;
    } else if (packageField === 'module') {
      outDir = `./${output.path ?? 'dist'}/js/treeshaking`;
    } else {
      outDir = `./${output.path ?? 'dist'}/js/modern`;
    }

    if (packageFieldValue === 'CJS+ES6') {
      buildConfig = {
        format: 'cjs',
        target: 'es6',
        outDir,
      };
    } else if (packageFieldValue === 'ESM+ES5') {
      buildConfig = {
        format: 'esm',
        target: 'es5',
        outDir,
      };
    } else if (packageFieldValue === 'ESM+ES6') {
      buildConfig = {
        format: 'esm',
        target: 'es6',
        outDir,
      };
    }

    transformSourceToBuildConfig(buildConfig, legacyUserConfig);
    transformToolsToBuildConfig(buildConfig, legacyUserConfig);
    transformOutputToBuildConfig(buildConfig, legacyUserConfig);

    buildConfigs.push(buildConfig);
  }

  buildConfigs.push({
    buildType: 'bundleless',
    outDir: './dist/types',
    dts: {
      only: true,
    },
  });

  // output.copy
  if (legacyUserConfig.output?.copy) {
    buildConfigs.push({
      copy: {
        patterns: legacyUserConfig.output.copy,
      },
    });
  }

  return {
    ...finalConfig,
    buildConfig: buildConfigs,
  };
};

export const createConfigByPackageMode = async (
  legacyUserConfig: Readonly<ModuleToolsLegacyUserConfig>,
): Promise<ModuleUserConfig> => {
  const finalConfig = await commonTransformAndLog(legacyUserConfig);

  const { legacyPresets } = await import('../constants/legacy-build-presets');
  const packageMode = legacyUserConfig.output!.packageMode!;
  const buildConfigs = legacyPresets[packageMode];

  for (const buildConfig of buildConfigs) {
    transformSourceToBuildConfig(buildConfig, legacyUserConfig);
    transformToolsToBuildConfig(buildConfig, legacyUserConfig);
    transformOutputToBuildConfig(buildConfig, legacyUserConfig);
    // NB: not process output.path
  }

  // output.copy
  if (legacyUserConfig.output?.copy) {
    buildConfigs.push({
      copy: {
        patterns: legacyUserConfig.output.copy,
      },
    });
  }
  return {
    ...finalConfig,
    buildConfig: buildConfigs,
  };
};

export const createConfigByDefault = async (
  legacyUserConfig: Readonly<ModuleToolsLegacyUserConfig>,
): Promise<ModuleUserConfig> => {
  const finalConfig = await commonTransformAndLog(legacyUserConfig);

  const { legacyPresets } = await import('../constants/legacy-build-presets');
  const buildConfigs = legacyPresets['universal-js'];

  for (const buildConfig of buildConfigs) {
    transformSourceToBuildConfig(buildConfig, legacyUserConfig);
    transformToolsToBuildConfig(buildConfig, legacyUserConfig);
    transformOutputToBuildConfig(buildConfig, legacyUserConfig);
    // NB: not process output.path
  }

  // output.copy
  if (legacyUserConfig.output?.copy) {
    buildConfigs.push({
      copy: {
        patterns: legacyUserConfig.output.copy,
      },
    });
  }
  return {
    ...finalConfig,
    buildConfig: buildConfigs,
  };
};

export const createUserConfigFromLegacy = async (
  config: Readonly<ModuleToolsLegacyUserConfig>,
): Promise<ModuleUserConfig> => {
  const { buildConfig, buildPreset, packageFields, packageMode } =
    config.output ?? {};

  if (buildConfig) {
    return createConfigByBuildConfig(config);
  }

  if (buildPreset) {
    return createConfigByBuildPreset(config);
  }

  if (packageFields) {
    return createConfigByPackageFields(config);
  }

  if (packageMode) {
    return createConfigByPackageFields(config);
  }

  return createConfigByDefault(config);
};

/* eslint-enable max-lines */
