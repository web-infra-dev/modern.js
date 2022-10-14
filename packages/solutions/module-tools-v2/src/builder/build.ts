import path from 'path';
import { Libuilder, CLIConfig, Style } from '@modern-js/libuild';
import { es5OutputPlugin } from '@modern-js/libuild-plugin-es5';
import { applyOptionsChain, ensureAbsolutePath } from '@modern-js/utils';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleToolsHooks,
  PluginAPI,
  DTSOptions,
  ModuleContext,
  SourceConfig,
} from '../types';
import { defaultTsConfigPath } from '../constants/dts';
import { runRollup, runTsc } from './dts';

export const runBuildTask = async (
  options: {
    buildConfig: BaseBuildConfig;
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
    sourceConfig: SourceConfig;
    styleConfig: Style;
  },
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const { buildConfig, buildCmdOptions, context, sourceConfig, styleConfig } =
    options;
  const dts = buildCmdOptions.dts ? buildConfig.dts : false;
  const watch = buildCmdOptions.watch ?? false;
  const { appDirectory } = context;

  const { verifyTsConfigPaths } = await import('../utils/dts');

  await verifyTsConfigPaths(
    buildConfig.dts
      ? buildConfig.dts.tsconfigPath
      : path.join(appDirectory, defaultTsConfigPath),
    sourceConfig.alias,
  );

  if (dts) {
    const tasks = dts.only ? [generatorDts] : [buildLib, generatorDts];
    const { default: pMap } = await import('p-map');
    await pMap(tasks, async task => {
      await task(buildConfig, api, { sourceConfig, watch, dts, styleConfig });
    });
  } else {
    await buildLib(buildConfig, api, { sourceConfig, watch, styleConfig });
  }

  const { copyTask } = await import('./copy');
  await copyTask(buildConfig.copy, { appDirectory });
};

export const generatorDts = async (
  config: BaseBuildConfig,
  api: PluginAPI,
  options: {
    sourceConfig: SourceConfig;
    watch: boolean;
    dts: DTSOptions;
  },
) => {
  const { sourceConfig, watch, dts } = options;
  const { buildType } = config;
  const { appDirectory } = api.useAppContext();
  const { tsconfigPath, distPath } = dts;
  if (buildType === 'bundle') {
    const {
      bundleOptions: { entry, externals },
    } = config;
    await runRollup({
      distDir: distPath,
      watch,
      externals,
      entry,
      tsconfigPath,
    });
  } else {
    const { sourceDir } = config.bundlelessOptions;
    await runTsc({
      appDirectory,
      alias: sourceConfig.alias,
      distAbsPath: distPath,
      watch,
      tsconfigPath,
      sourceDir,
    });
  }
};

export const buildLib = async (
  config: BaseBuildConfig,
  api: PluginAPI,
  options: {
    sourceConfig: SourceConfig;
    styleConfig: Style;
    watch: boolean;
  },
) => {
  const { sourceConfig, watch, styleConfig } = options;
  const { target, buildType, sourceMap, format, path: distPath } = config;
  const { appDirectory, srcDirectory } = api.useAppContext();
  // TODO: style
  const style = {};

  // sourceConfig
  const { envVars, globalVars, alias: userAlias } = sourceConfig;
  const envVarsDefine = [...(envVars || [])].reduce<Record<string, string>>(
    (memo, name) => {
      memo[`process.env.${name}`] = JSON.stringify(process.env[name]);
      return memo;
    },
    {},
  );
  const globalVarsDefine = Object.keys(globalVars || {}).reduce<
    Record<string, string>
  >((memo, name) => {
    memo[name] = globalVars ? JSON.stringify(globalVars[name]) : '';
    return memo;
  }, {});
  const define = {
    ...envVarsDefine,
    ...globalVarsDefine,
  };
  const defaultAlias = {
    '@': srcDirectory,
  };

  const mergedAlias = applyOptionsChain(defaultAlias, userAlias);

  const alias = Object.keys(mergedAlias).reduce((o, name) => {
    return {
      ...o,
      [name]: ensureAbsolutePath(appDirectory, mergedAlias[name]),
    };
  }, {});

  const commonLiBuildConfig: CLIConfig = {
    root: appDirectory,
    watch,
    target,
    sourceMap,
    format,
    outdir: distPath,
    define,
    style,
    resolve: {
      alias,
    },
  };

  if (buildType === 'bundle') {
    const {
      bundleOptions: {
        entry,
        platform,
        splitting,
        minify,
        externals,
        assets,
        entryNames,
        globals,
        metafile,
        jsx,
        getModuleId,
      },
    } = config;

    const plugins = target === 'es5' ? [es5OutputPlugin()] : [];
    const bundleConfig: CLIConfig = {
      ...commonLiBuildConfig,
      platform,
      input: entry,
      jsx,
      metafile,
      globals,
      entryNames,
      asset: assets,
      splitting,
      style: styleConfig,
      // resolve: { alias },
      // define,
      sourceMap,
      minify,
      external: externals,
      plugins,
      getModuleId,
    };
    await Libuilder.run(bundleConfig);
  } else {
    const {
      bundlelessOptions: { sourceDir, assets },
    } = config;
    const bundlelessConfig: CLIConfig = {
      ...commonLiBuildConfig,
      sourceDir,
      asset: {
        outdir: assets.path,
      },
      bundle: false,
    };
    await Libuilder.run(bundlelessConfig);
  }
};
