import path from 'path';
import { Libuilder, CLIConfig } from '@modern-js/libuild';
import { es5OutputPlugin } from '@modern-js/libuild-plugin-es5';
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
  },
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const { buildConfig, buildCmdOptions, context, sourceConfig } = options;
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
      await task(buildConfig, api, sourceConfig, watch, dts);
    });
  } else {
    await buildLib(buildConfig, api, sourceConfig, watch);
  }
};

export const generatorDts = async (
  config: BaseBuildConfig,
  api: PluginAPI,
  sourceConfig: SourceConfig,
  watch: boolean,
  dts: DTSOptions,
) => {
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
  _: PluginAPI,
  sourceConfig: SourceConfig,
  watch: boolean,
) => {
  const { target, buildType, sourceMap, format, path: distPath } = config;

  // TODO: Implementation of sourceConfig
  console.info(sourceConfig);

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
      platform,
      watch,
      input: entry,
      target,
      outdir: distPath,
      format,
      jsx,
      metafile,
      globals,
      entryNames,
      asset: assets,
      splitting,
      // style,
      // resolve: { alias },
      // define,
      sourceMap,
      minify,
      external: externals,
      plugins,
      getModuleId,
    };
    await Libuilder.run(bundleConfig);
  }
};
