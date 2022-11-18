import { ModuleContext } from '../types';
import type {
  BaseBuildConfig,
  BundleOptions,
  PartialBaseBuildConfig,
  PartialBuildConfig,
  PartialBaseBundlelessBuildConfig,
  PartialBaseBundleBuildConfig,
  DTSOptions,
  PartialBaseCommonBuildConfig,
} from '../types/config';

export const validPartialBuildConfig = (config: PartialBuildConfig) => {
  if (Array.isArray(config)) {
    for (const c of config) {
      validBuildTypeAndFormat(c);
    }
  } else {
    validBuildTypeAndFormat(config);
  }
};

export const validBuildTypeAndFormat = (config: PartialBaseBuildConfig) => {
  if (
    config.buildType === 'bundleless' &&
    ['iife', 'umd'].includes(config.format ?? '')
  ) {
    throw new Error(
      `when buildType is bundleless, the format must be equal to one of the allowed values: (cjs, esm)`,
    );
  }
};

export const mergeDefaultBaseConfig = async (
  pConfig: PartialBaseBuildConfig,
  context: ModuleContext,
): Promise<BaseBuildConfig> => {
  if (pConfig.buildType === 'bundle') {
    return mergeBundleBaseConfig(pConfig, context);
  }

  return mergeBundlelessBaseConfig(pConfig as PartialBaseBundlelessBuildConfig);
};

export const mergeBundleBaseConfig = async (
  pConfig: PartialBaseBundleBuildConfig,
  context: ModuleContext,
) => {
  const { defaultBundleBuildConfig: defaultConfig } = await import(
    '../constants/build'
  );
  const { cloneDeep } = await import('@modern-js/utils/lodash');

  const { getDefaultIndexEntry } = await import('./entry');
  const finalEntry = await getDefaultIndexEntry(context);
  const { bundleOptions: boptions } = pConfig;

  const bundleOptions = boptions
    ? ({
        entry: boptions.entry ?? cloneDeep(finalEntry),
        platform: boptions.platform ?? defaultConfig.bundleOptions.platform,
        splitting: boptions.splitting ?? defaultConfig.bundleOptions.splitting,
        minify: boptions.minify ?? defaultConfig.bundleOptions.minify,
        skipDeps: boptions.skipDeps ?? defaultConfig.bundleOptions.skipDeps,
        entryNames:
          boptions.entryNames ?? defaultConfig.bundleOptions.entryNames,
        globals:
          boptions.globals ?? cloneDeep(defaultConfig.bundleOptions.globals),
        metafile: boptions.metafile ?? defaultConfig.bundleOptions.metafile,
        umdModuleName:
          boptions.umdModuleName ?? defaultConfig.bundleOptions.umdModuleName,
        externals: boptions.externals ?? defaultConfig.bundleOptions.externals,
      } as BundleOptions)
    : {
        ...cloneDeep(defaultConfig.bundleOptions),
        entry: cloneDeep(finalEntry),
      };

  return {
    asset: {
      path: './',
      rebase: undefined,
      name: undefined,
      limit: undefined,
      publicPath: undefined,
      ...pConfig.asset,
    },
    buildType: defaultConfig.buildType,
    format: pConfig.format ?? defaultConfig.format,
    target: pConfig.target ?? defaultConfig.target,
    sourceMap: pConfig.sourceMap ?? defaultConfig.sourceMap,
    copy: pConfig.copy ?? cloneDeep(defaultConfig.copy),
    path: pConfig.path ?? defaultConfig.path,
    dts: await getDtsConfig(pConfig.dts, defaultConfig.dts as DTSOptions),
    jsx: pConfig.jsx ?? defaultConfig.jsx,
    bundleOptions,
  };
};

export const mergeBundlelessBaseConfig = async (
  pConfig: PartialBaseBundlelessBuildConfig,
) => {
  const { defaultBundlelessBuildConfig: defaultConfig } = await import(
    '../constants/build'
  );
  const { cloneDeep } = await import('@modern-js/utils/lodash');
  const { bundlelessOptions } = pConfig;
  return {
    asset: {
      path: './',
      rebase: undefined,
      name: undefined,
      limit: undefined,
      publicPath: undefined,
      ...pConfig.asset,
    },
    buildType: defaultConfig.buildType,
    format: pConfig.format ?? defaultConfig.format,
    target: pConfig.target ?? defaultConfig.target,
    sourceMap: pConfig.sourceMap ?? defaultConfig.sourceMap,
    copy: pConfig.copy ?? cloneDeep(defaultConfig.copy),
    path: pConfig.path ?? defaultConfig.path,
    dts: await getDtsConfig(pConfig.dts, defaultConfig.dts as DTSOptions),
    jsx: pConfig.jsx ?? defaultConfig.jsx,
    bundlelessOptions: bundlelessOptions
      ? {
          sourceDir:
            bundlelessOptions.sourceDir ??
            defaultConfig.bundlelessOptions.sourceDir,
          styleCompileMode:
            bundlelessOptions.styleCompileMode ??
            defaultConfig.bundlelessOptions.styleCompileMode,
        }
      : cloneDeep(defaultConfig.bundlelessOptions),
  };
};

export const getDtsConfig = async (
  userDTS: PartialBaseCommonBuildConfig['dts'],
  defaultDTS: DTSOptions,
) => {
  const { cloneDeep, isUndefined, isObject } = await import(
    '@modern-js/utils/lodash'
  );

  if (isUndefined(userDTS)) {
    return cloneDeep(defaultDTS);
  }

  if (isObject(userDTS)) {
    return {
      ...defaultDTS,
      ...userDTS,
    };
  }

  return userDTS;

  // let finalRet;
  // if (isUndefined(userDTS)) {
  //   finalRet = cloneDeep(defaultDTS);
  // } else if (isObject(userDTS)) {
  //   finalRet = {
  //     ...defaultDTS,
  //     ...userDTS,
  //   };
  // } else {
  //   finalRet = userDTS;
  // }
  // console.info('finalRet', finalRet);
  // return finalRet;
};
