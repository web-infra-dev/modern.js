import type { CLIConfig, Style } from '@modern-js/libuild';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleToolsHooks,
  PluginAPI,
  DTSOptions,
  ModuleContext,
} from '../types';

export const runBuildTask = async (
  options: {
    buildConfig: BaseBuildConfig;
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
    styleConfig: Style;
  },
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const { buildConfig, context } = options;
  const { appDirectory, isTsProject } = context;
  console.info(buildConfig);
  if (isTsProject) {
    await buildInTsProject(options, api);
  } else {
    await buildInJsProject(options, api);
  }

  const { copyTask } = await import('./copy');
  await copyTask(buildConfig, { appDirectory });
};

export const buildInTsProject = async (
  options: {
    buildConfig: BaseBuildConfig;
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
    styleConfig: Style;
  },
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const { buildConfig, buildCmdOptions, styleConfig } = options;
  const dts = buildCmdOptions.dts ? buildConfig.dts : false;
  const watch = buildCmdOptions.watch ?? false;

  if (dts === false) {
    await buildLib(buildConfig, api, { watch, styleConfig });
  } else {
    const tasks = dts.only ? [generatorDts] : [buildLib, generatorDts];
    const { default: pMap } = await import('../../compiled/p-map');
    await pMap(tasks, async task => {
      await task(buildConfig, api, { watch, dts, styleConfig });
    });
  }
};

export const buildInJsProject = async (
  options: {
    buildConfig: BaseBuildConfig;
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
    styleConfig: Style;
  },
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const { buildConfig, buildCmdOptions, styleConfig } = options;
  const dts = buildCmdOptions.dts ? buildConfig.dts : false;
  const watch = buildCmdOptions.watch ?? false;

  if (dts !== false && dts.only) {
    return;
  }

  await buildLib(buildConfig, api, { watch, styleConfig });
};

export const generatorDts = async (
  config: BaseBuildConfig,
  api: PluginAPI,
  options: {
    watch: boolean;
    dts: DTSOptions;
  },
) => {
  const { runRollup, runTsc } = await import('./dts');
  const { watch, dts } = options;
  const { buildType, input, sourceDir, alias } = config;
  const { appDirectory } = api.useAppContext();
  const { tsconfigPath, distPath } = dts;
  if (buildType === 'bundle') {
    const { getFinalExternals } = await import('../utils/builder');
    const finalExternals = await getFinalExternals(config, { appDirectory });

    await runRollup({
      distDir: distPath,
      watch,
      externals: finalExternals,
      input,
      tsconfigPath,
    });
  } else {
    await runTsc({
      appDirectory,
      alias,
      distAbsPath: distPath,
      watch,
      tsconfigPath,
      sourceDir,
    });
  }
};

export const buildLib = async (
  config: BaseBuildConfig,
  api: PluginAPI<ModuleToolsHooks>,
  options: {
    styleConfig: Style;
    watch: boolean;
  },
) => {
  const { watch, styleConfig } = options;
  const {
    target,
    buildType,
    sourceMap,
    format,
    outdir: distPath,
    asset,
    jsx,
    input,
    platform,
    splitting,
    minify,
    sourceDir,
    entryNames,
    umdGlobals,
    umdModuleName,
    define,
    alias: userAlias,
  } = config;
  const { appDirectory, srcDirectory } = api.useAppContext();

  const defaultAlias = {
    '@': srcDirectory,
  };

  const { applyOptionsChain, ensureAbsolutePath } = await import(
    '@modern-js/utils'
  );
  const mergedAlias = applyOptionsChain(defaultAlias, userAlias);

  const alias = Object.keys(mergedAlias).reduce((o, name) => {
    return {
      ...o,
      [name]: ensureAbsolutePath(appDirectory, mergedAlias[name]),
    };
  }, {});

  const { getFinalExternals } = await import('../utils/builder');
  const finalExternals = await getFinalExternals(config, { appDirectory });

  const { es5Plugin } = await import('@modern-js/libuild-plugin-es5');
  const { umdPlugin } = await import('@modern-js/libuild-plugin-umd');
  const plugins = target === 'es5' ? [es5Plugin()] : [];
  if (format === 'umd') {
    plugins.push(umdPlugin({ moduleName: umdModuleName }));
  }
  const { watchPlugin, externalPlugin } = await import(
    '../utils/libuild-plugins'
  );
  plugins.push(watchPlugin(config));
  const buildConfig: CLIConfig = {
    root: appDirectory,
    watch,
    target,
    sourceMap,
    format,
    outdir: distPath,
    define,
    style: styleConfig,
    resolve: {
      alias,
    },
    asset: {
      ...asset,
      outdir: asset.path,
    },
    plugins,
    jsx,
    input,
    platform,
    splitting,
    minify,
    sourceDir,
    entryNames,
    globals: umdGlobals,
    external: finalExternals,
    bundle: buildType === 'bundle',
    // outbase for [dir]/[name]
    outbase: sourceDir,
  };
  plugins.push(externalPlugin(config, { appDirectory }));

  try {
    const { Libuilder } = await import('@modern-js/libuild');

    const runner = api.useHookRunners();
    const modifiedBuildConfig = await runner.modifyLibuild(buildConfig, {
      onLast: c => c,
    });

    const builder = await Libuilder.create(modifiedBuildConfig);
    await builder.build();

    if (watch) {
      const { watchSectionTitle } = await import('../utils/log');
      const { SectionTitleStatus } = await import('../constants/log');
      const titleText = `[${
        buildType === 'bundle' ? 'Bundle' : 'Bundleless'
      }: ${format}_${target}]`;

      console.info(
        await watchSectionTitle(titleText, SectionTitleStatus.Success),
      );
    }
  } catch (e: any) {
    const { InternalBuildError } = await import('../error');
    throw new InternalBuildError(e, {
      target,
      format,
      buildType: 'bundle',
    });
  }
};
