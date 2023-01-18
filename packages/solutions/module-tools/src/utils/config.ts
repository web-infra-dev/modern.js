import { ModuleContext } from '../types';
import type {
  BaseBuildConfig,
  PartialBuildConfig,
  PartialBaseBuildConfig,
  DTSOptions,
  ModuleLegacyUserConfig,
} from '../types';

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
  const { defaultBuildConfig: defaultConfig } = await import(
    '../constants/build'
  );
  const { cloneDeep } = await import('@modern-js/utils/lodash');
  const { applyOptionsChain, ensureAbsolutePath, slash } = await import(
    '@modern-js/utils'
  );
  const { getDefaultIndexEntry } = await import('./input');
  const { getStyleConfig } = await import('./style');
  const defaultAlias = {
    '@': context.srcDirectory,
  };
  const mergedAlias = applyOptionsChain(defaultAlias, pConfig.alias);

  /**
   * Format alias value:
   * - Relative paths need to be turned into absolute paths.
   * - Absolute paths or a package name are not processed.
   */
  const alias = Object.keys(mergedAlias).reduce<Record<string, string>>(
    (prev, name) => {
      const formattedValue = (value: string) => {
        if (typeof value === 'string' && value.startsWith('.')) {
          return slash(ensureAbsolutePath(context.appDirectory, value));
        }
        return value;
      };
      const value = formattedValue(mergedAlias[name]);

      prev[name] = value;
      return prev;
    },
    {},
  );

  const styleConfig = await getStyleConfig(pConfig);
  const buildType = pConfig.buildType ?? defaultConfig.buildType;
  const sourceDir = pConfig.sourceDir ?? defaultConfig.sourceDir;
  const metafile = pConfig.metafile ?? defaultConfig.metafile;
  const input =
    buildType === 'bundle' ? await getDefaultIndexEntry(context) : [sourceDir];
  const userDefine = pConfig.define ?? {};
  const define = {
    ...defaultConfig.define,
    ...Object.keys(userDefine).reduce<Record<string, string>>((memo, name) => {
      memo[name] = JSON.stringify(userDefine[name]!);
      return memo;
    }, {}),
  };
  return {
    asset: {
      ...defaultConfig.asset,
      ...pConfig.asset,
    },
    buildType,
    format: pConfig.format ?? defaultConfig.format,
    target: pConfig.target ?? defaultConfig.target,
    sourceMap: pConfig.sourceMap ?? defaultConfig.sourceMap,
    copy: pConfig.copy ?? cloneDeep(defaultConfig.copy),
    outDir: pConfig.outDir ?? defaultConfig.outDir,
    dts: await getDtsConfig(pConfig.dts, defaultConfig.dts as DTSOptions),
    jsx: pConfig.jsx ?? defaultConfig.jsx,
    input: pConfig.input ?? cloneDeep(input),
    platform: pConfig.platform ?? defaultConfig.platform,
    splitting: pConfig.splitting ?? defaultConfig.splitting,
    minify: pConfig.minify ?? defaultConfig.minify,
    autoExternal: pConfig.autoExternal ?? defaultConfig.autoExternal,
    umdGlobals: {
      ...defaultConfig.umdGlobals,
      ...pConfig.umdGlobals,
    },
    umdModuleName: pConfig.umdModuleName ?? defaultConfig.umdModuleName,
    externals: pConfig.externals ?? defaultConfig.externals,
    sourceDir,
    alias,
    define,
    metafile,
    style: {
      ...styleConfig,
      inject: pConfig.style?.inject ?? defaultConfig.style.inject,
      modules: pConfig.style?.modules ?? defaultConfig.style.modules,
      autoModules:
        pConfig.style?.autoModules ?? defaultConfig.style.autoModules,
      tailwindCss: defaultConfig.style.tailwindCss,
    },
  };
};

export const getDtsConfig = async (
  userDTS: PartialBaseBuildConfig['dts'],
  defaultDTS: Required<DTSOptions>,
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
};

export const isLegacyUserConfig = (config: {
  legacy?: boolean;
}): config is ModuleLegacyUserConfig => Boolean(config.legacy);
