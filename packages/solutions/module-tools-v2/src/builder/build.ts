import path from 'path';
import { Libuilder, CLIConfig } from '@modern-js/libuild';
import { es5OutputPlugin } from '@modern-js/libuild-plugin-es5';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleToolsHooks,
  PluginAPI,
  DTSOptions,
} from '../types';
import { runRollup } from './dts';

export const runBuildTask = async (
  config: BaseBuildConfig,
  options: BuildCommandOptions,
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const dts = options.dts ? config.dts : false;
  const watch = options.watch ?? false;
  const { appDirectory } = api.useAppContext();
  if (dts) {
    const dtsOptions = {
      only: dts.only ?? false,
      distPath: path.resolve(appDirectory, dts.distPath ?? 'dist/types'),
      tsconfigPath: path.resolve(
        appDirectory,
        options.tsconfig ?? dts.tsconfigPath ?? 'tsconfig.json',
      ),
    };
    const tasks = dtsOptions.only ? [generatorDts] : [buildLib, generatorDts];
    const { default: pMap } = await import('p-map');
    await pMap(tasks, async task => {
      await task(config, api, watch, dts);
    });
  } else {
    await buildLib(config, api, watch);
  }
};

export const generatorDts = async (
  config: BaseBuildConfig,
  api: PluginAPI,
  watch: boolean,
  dts: DTSOptions,
) => {
  const { buildType, entry } = config;
  const { appDirectory } = api.useAppContext();
  const { tsconfigPath, distPath } = dts;
  const distDir = path.join(appDirectory, distPath);
  if (buildType === 'bundle') {
    const {
      bundleOptions: { externals },
    } = config;
    await runRollup({
      distDir,
      watch,
      externals,
      entry,
      tsconfigPath,
    });
  } else {
    // TODO: bundleless
  }
};

export const buildLib = async (
  config: BaseBuildConfig,
  api: PluginAPI,
  watch: boolean,
) => {
  const {
    target,
    buildType,
    sourceMap,
    entry,
    format,
    path: distPath,
  } = config;
  const { appDirectory } = api.useAppContext();
  if (buildType === 'bundle') {
    const {
      bundleOptions: {
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

    const outdir = path.join(appDirectory, distPath);

    const plugins = target === 'es5' ? [es5OutputPlugin()] : [];
    const bundleConfig: CLIConfig = {
      platform,
      watch,
      input: entry,
      target,
      outdir,
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
