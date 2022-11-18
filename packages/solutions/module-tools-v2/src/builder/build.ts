import type { CLIConfig, Style } from '@modern-js/libuild';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleToolsHooks,
  PluginAPI,
  DTSOptions,
  ModuleContext,
  SourceConfig,
} from '../types';

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
  const { buildConfig, context } = options;
  const { appDirectory, isTsProject } = context;
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
    sourceConfig: SourceConfig;
    styleConfig: Style;
  },
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const { buildConfig, buildCmdOptions, sourceConfig, styleConfig } = options;
  const dts = buildCmdOptions.dts ? buildConfig.dts : false;
  const watch = buildCmdOptions.watch ?? false;
  // const { verifyTsConfigPaths } = await import('../utils/dts');
  // const { defaultTsConfigPath } = await import('../constants/dts');
  // await verifyTsConfigPaths(
  //   buildConfig.dts
  //     ? buildConfig.dts.tsconfigPath
  //     : path.join(appDirectory, defaultTsConfigPath),
  //   sourceConfig.alias,
  // );

  if (dts === false) {
    await buildLib(buildConfig, api, { sourceConfig, watch, styleConfig });
  } else {
    const tasks = dts.only ? [generatorDts] : [buildLib, generatorDts];
    const { default: pMap } = await import('../../compiled/p-map');
    await pMap(tasks, async task => {
      await task(buildConfig, api, { sourceConfig, watch, dts, styleConfig });
    });
  }
};

export const buildInJsProject = async (
  options: {
    buildConfig: BaseBuildConfig;
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
    sourceConfig: SourceConfig;
    styleConfig: Style;
  },
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const { buildConfig, buildCmdOptions, sourceConfig, styleConfig } = options;
  const dts = buildCmdOptions.dts ? buildConfig.dts : false;
  const watch = buildCmdOptions.watch ?? false;

  if (dts !== false && dts.only) {
    return;
  }

  await buildLib(buildConfig, api, { sourceConfig, watch, styleConfig });
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
  const { runRollup, runTsc } = await import('./dts');
  const { sourceConfig, watch, dts } = options;
  const { buildType } = config;
  const { appDirectory } = api.useAppContext();
  const { tsconfigPath, distPath } = dts;
  if (buildType === 'bundle') {
    const {
      bundleOptions: { entry },
    } = config;

    const { getFinalExternals } = await import('../utils/builder');
    const finalExternals = await getFinalExternals(config, { appDirectory });

    await runRollup({
      distDir: distPath,
      watch,
      externals: finalExternals,
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
  const {
    target,
    buildType,
    sourceMap,
    format,
    path: distPath,
    asset,
  } = config;
  const { appDirectory, srcDirectory } = api.useAppContext();

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

  const { es5Plugin } = await import('@modern-js/libuild-plugin-es5');
  const { umdPlugin } = await import('@modern-js/libuild-plugin-umd');
  const plugins = target === 'es5' ? [es5Plugin()] : [];

  const { watchPlugin, externalPlugin } = await import(
    '../utils/libuild-plugins'
  );
  plugins.push(watchPlugin(config));
  const { path: outdir, ...resetAsset } = asset ?? {};
  const commonLiBuildConfig: CLIConfig = {
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
      ...resetAsset,
      outdir,
    },
    plugins,
  };

  if (buildType === 'bundle') {
    const finalExternals = await getFinalExternals(config, { appDirectory });
    const {
      jsx,
      bundleOptions: {
        entry,
        platform,
        splitting,
        minify,
        entryNames,
        globals,
        metafile,
        umdModuleName,
      },
    } = config;

    if (format === 'umd') {
      plugins.push(
        umdPlugin(umdModuleName ? { moduleName: umdModuleName } : undefined),
      );
    }

    plugins.push(externalPlugin(config, { appDirectory }));

    const bundleConfig: CLIConfig = {
      ...commonLiBuildConfig,
      platform,
      input: entry,
      jsx,
      metafile,
      globals,
      entryNames,
      splitting,
      sourceMap,
      minify,
      external: finalExternals,
    };
    // console.info('bundleConfig', bundleConfig);
    try {
      const { Libuilder } = await import('@modern-js/libuild');
      const builder = await Libuilder.create(bundleConfig);
      await builder.build();

      if (watch) {
        const { watchSectionTitle } = await import('../utils/log');
        const { SectionTitleStatus } = await import('../constants/log');
        const titleText = `[Bundle: ${format}_${target}]`;
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
  } else {
    const {
      bundlelessOptions: { sourceDir },
    } = config;
    const bundlelessConfig: CLIConfig = {
      ...commonLiBuildConfig,
      input: [sourceDir],
      bundle: false,
      outbase: sourceDir,
    };

    try {
      const { Libuilder } = await import('@modern-js/libuild');
      const builder = await Libuilder.create(bundlelessConfig);
      await builder.build();

      if (watch) {
        const { watchSectionTitle } = await import('../utils/log');
        const { SectionTitleStatus } = await import('../constants/log');
        const titleText = `[Bundleless: ${format}_${target}]`;
        console.info(
          await watchSectionTitle(titleText, SectionTitleStatus.Success),
        );
      }
    } catch (e: any) {
      const { InternalBuildError } = await import('../error');
      throw new InternalBuildError(e, {
        target,
        format,
        buildType: 'bundleless',
      });
    }
  }
};
