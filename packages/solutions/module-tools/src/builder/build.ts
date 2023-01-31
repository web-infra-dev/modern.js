import { join } from 'path';
import type { CLIConfig } from '@modern-js/libuild';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleTools,
  PluginAPI,
  DTSOptions,
  ModuleContext,
} from '../types';

export const runBuildTask = async (
  options: {
    buildConfig: BaseBuildConfig;
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
  },
  api: PluginAPI<ModuleTools>,
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
  },
  api: PluginAPI<ModuleTools>,
) => {
  const { buildConfig, buildCmdOptions } = options;
  const dts = buildCmdOptions.dts ? buildConfig.dts : false;
  const skipBuildLib = buildConfig.dts ? buildConfig.dts.only : false;
  const watch = buildCmdOptions.watch ?? false;

  if (dts === false) {
    // --no-dts and buildConfig is `{ dts: { only: true } }`, then skip.
    !skipBuildLib && (await buildLib(buildConfig, api, { watch }));
  } else {
    const tasks = dts.only ? [generatorDts] : [buildLib, generatorDts];
    const { default: pMap } = await import('../../compiled/p-map');
    await pMap(tasks, async task => {
      await task(buildConfig, api as any, { watch, dts });
    });
  }
};

export const buildInJsProject = async (
  options: {
    buildConfig: BaseBuildConfig;
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
  },
  api: PluginAPI<ModuleTools>,
) => {
  const { buildConfig, buildCmdOptions } = options;
  const dts = buildCmdOptions.dts ? buildConfig.dts : false;
  const watch = buildCmdOptions.watch ?? false;

  if (dts !== false && dts.only) {
    return;
  }

  await buildLib(buildConfig, api, { watch });
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
  api: PluginAPI<ModuleTools>,
  options: {
    watch: boolean;
  },
) => {
  const { watch } = options;
  const {
    target,
    buildType,
    sourceMap,
    format,
    outDir: distPath,
    asset,
    jsx,
    input,
    platform,
    splitting,
    minify,
    sourceDir,
    umdGlobals,
    umdModuleName,
    define,
    alias,
    style,
    externals,
    autoExternal,
    dts,
    metafile,
  } = config;
  const { appDirectory } = api.useAppContext();
  const { slash } = await import('@modern-js/utils');
  const root = slash(appDirectory);
  const outdir = slash(distPath);
  const assetOutDir = asset.path ? slash(asset.path) : asset.path;
  const { less, sass, postcss, inject, modules, autoModules } = style;

  // support es5,umd and emitDecoratorMetadata by swc
  const { es5Plugin, umdPlugin, transformPlugin } = await import(
    '@modern-js/libuild-plugin-swc'
  );
  const plugins = format === 'umd' ? [umdPlugin(umdModuleName)] : [];
  if (target === 'es5') {
    plugins.push(es5Plugin());
  }
  const { getProjectTsconfig } = await import('./dts/tsc');
  const tsconfigPath = dts
    ? dts.tsconfigPath
    : join(appDirectory, './tsconfig.json');
  const userTsconfig = await getProjectTsconfig(tsconfigPath);
  if (userTsconfig?.compilerOptions?.emitDecoratorMetadata) {
    plugins.push(
      transformPlugin({
        jsc: {
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
        },
      }),
    );
  }

  // support svgr
  if (asset.svgr) {
    const { svgrPlugin } = await import('@modern-js/libuild-plugin-svgr');
    const options = typeof asset.svgr === 'boolean' ? {} : asset.svgr;
    plugins.push(svgrPlugin(options));
  }

  // adapt module tools
  const { watchPlugin, externalPlugin } = await import(
    '../utils/libuild-plugins'
  );
  plugins.push(watchPlugin(config));
  plugins.push(externalPlugin(config, { appDirectory }));

  const buildConfig: CLIConfig = {
    root,
    watch,
    target,
    sourceMap,
    format,
    outdir,
    define,
    style: {
      less,
      sass,
      postcss,
      inject,
      modules,
      autoModules,
    },
    resolve: {
      alias,
    },
    asset: {
      ...asset,
      outdir: assetOutDir,
    },
    plugins,
    jsx,
    input,
    platform,
    splitting,
    minify,
    sourceDir,
    metafile: metafile && buildType === 'bundle',
    globals: umdGlobals,
    external: externals,
    autoExternal,
    bundle: buildType === 'bundle',
    // outbase for [dir]/[name]
    outbase: sourceDir,
    logLevel: 'error',
    esbuildOptions: (options: any) => ({
      ...options,
      supported: {
        'dynamic-import': !(
          ['cjs', 'umd'].includes(format) && buildType === 'bundleless'
        ),
      },
    }),
  };

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
      buildType,
    });
  }
};
