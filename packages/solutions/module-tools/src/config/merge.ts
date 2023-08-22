import { isObject } from '@modern-js/utils';
import { ModuleContext } from '../types';
import type {
  BaseBuildConfig,
  PartialBaseBuildConfig,
  DTSOptions,
  ModuleLegacyUserConfig,
  BuildCommandOptions,
} from '../types';
import { getAllDeps } from '../utils/builder';
import { normalizeInput } from '../utils/input';

export const mergeDefaultBaseConfig = async (
  pConfig: PartialBaseBuildConfig,
  options: { context: ModuleContext; buildCmdOptions: BuildCommandOptions },
): Promise<BaseBuildConfig> => {
  const { context, buildCmdOptions } = options;
  const { defaultBuildConfig: defaultConfig } = await import(
    '../constants/build'
  );
  const { applyOptionsChain, ensureAbsolutePath, slash } = await import(
    '@modern-js/utils'
  );
  const { getDefaultIndexEntry } = await import('../utils/input');
  const { getStyleConfig } = await import('../utils/style');
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
  const defaultIndexEntry =
    buildType === 'bundle' ? await getDefaultIndexEntry(context) : [sourceDir];
  const input = await normalizeInput(defaultIndexEntry, context.appDirectory);
  const userDefine = pConfig.define ?? {};
  const define = {
    ...defaultConfig.define,
    ...Object.keys(userDefine).reduce<Record<string, string>>((memo, name) => {
      memo[name] = JSON.stringify(userDefine[name]!);
      return memo;
    }, {}),
  };
  const { dts: cmdDts, tsconfig: cmdTsconfigPath } = buildCmdOptions;

  // Impact eslint complexity
  const noDts = cmdDts === false || pConfig.dts === false;

  const dts = noDts
    ? false
    : ({
        ...defaultConfig.dts,
        ...pConfig.dts,
      } as DTSOptions);

  if (dts) {
    if (cmdTsconfigPath) {
      dts.tsconfigPath = cmdTsconfigPath;
    }
  }
  let externals = pConfig.externals ?? defaultConfig.externals;

  const autoExternal = pConfig.autoExternal ?? defaultConfig.autoExternal;

  if (autoExternal) {
    const deps = await getAllDeps(
      context.appDirectory,
      isObject(autoExternal)
        ? autoExternal
        : {
            dependencies: true,
            peerDependencies: true,
          },
    );
    externals = [
      ...deps.map(dep => new RegExp(`^${dep}($|\\/|\\\\)`)),
      ...(externals || []),
    ];
  }

  const esbuildOptions = pConfig.esbuildOptions ?? defaultConfig.esbuildOptions;
  return {
    asset: {
      ...defaultConfig.asset,
      ...pConfig.asset,
    },
    buildType,
    format: pConfig.format ?? defaultConfig.format,
    target: pConfig.target ?? defaultConfig.target,
    sourceMap: pConfig.sourceMap ?? defaultConfig.sourceMap,
    copy: pConfig.copy ?? defaultConfig.copy,
    outDir: pConfig.outDir ?? defaultConfig.outDir,
    dts,
    jsx: pConfig.jsx ?? defaultConfig.jsx,
    input: pConfig.input ?? input,
    platform: pConfig.platform ?? defaultConfig.platform,
    splitting: pConfig.splitting ?? defaultConfig.splitting,
    minify: pConfig.minify ?? defaultConfig.minify,
    autoExternal,
    umdGlobals: {
      ...defaultConfig.umdGlobals,
      ...pConfig.umdGlobals,
    },
    umdModuleName: pConfig.umdModuleName ?? defaultConfig.umdModuleName,
    sideEffects: pConfig.sideEffects ?? defaultConfig.sideEffects,
    externals,
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
      tailwindcss:
        pConfig.style?.tailwindcss ?? defaultConfig.style.tailwindcss,
    },
    redirect: {
      ...defaultConfig.redirect,
      ...pConfig.redirect,
    },
    esbuildOptions,
    externalHelpers: pConfig.externalHelpers ?? defaultConfig.externalHelpers,
    transformImport: pConfig.transformImport ?? defaultConfig.transformImport,
    transformLodash: pConfig.transformLodash ?? defaultConfig.transformLodash,
    sourceType: pConfig.sourceType ?? defaultConfig.sourceType,
    disableSwcTransform:
      pConfig.disableSwcTransform ?? defaultConfig.disableSwcTransform,
  };
};

export const isLegacyUserConfig = (config: {
  legacy?: boolean;
}): config is ModuleLegacyUserConfig => Boolean(config.legacy);
