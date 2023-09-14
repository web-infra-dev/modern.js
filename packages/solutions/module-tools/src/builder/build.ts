import { resolve } from 'path';
import type { CLIConfig } from '@modern-js/libuild';
import { slash, logger } from '@modern-js/utils';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleTools,
  PluginAPI,
  DTSOptions,
  ModuleContext,
  TsTarget,
} from '../types';
import pMap from '../../compiled/p-map';
import { copyTask } from './copy';

export const runBuildTask = async (
  options: {
    buildConfig: BaseBuildConfig;
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
  },
  api: PluginAPI<ModuleTools>,
) => {
  const { buildConfig, context, buildCmdOptions } = options;
  const { appDirectory, isTsProject } = context;

  await copyTask(buildConfig, { appDirectory, watch: buildCmdOptions.watch });

  if (isTsProject) {
    await buildInTsProject(options, api);
  } else {
    await buildInJsProject(options, api);
  }
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
  api: PluginAPI<ModuleTools>,
  options: {
    watch: boolean;
    dts: DTSOptions;
  },
) => {
  const { runRollup, runTsc } = await import('./dts');
  const { watch, dts } = options;
  const { buildType, input, sourceDir, alias, externals } = config;
  const { appDirectory } = api.useAppContext();
  const { tsconfigPath, distPath, abortOnError, respectExternal } = dts;
  if (buildType === 'bundle') {
    await runRollup(api, {
      distDir: distPath,
      watch,
      externals,
      input,
      tsconfigPath,
      abortOnError,
      respectExternal,
      appDirectory,
    });
  } else {
    await runTsc(api, {
      appDirectory,
      alias,
      distAbsPath: distPath,
      watch,
      tsconfigPath,
      sourceDir,
      abortOnError,
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
    sideEffects,
    redirect,
    esbuildOptions,
    externalHelpers,
    transformImport,
    transformLodash,
    sourceType,
    disableSwcTransform,
  } = config;
  const { appDirectory } = api.useAppContext();
  const root = slash(appDirectory);
  const outdir = slash(distPath);
  const assetOutDir = asset.path ? slash(asset.path) : asset.path;
  const { less, sass, postcss, inject, modules, autoModules } = style;

  // support swc-transform, umd and emitDecoratorMetadata by swc
  const {
    umdPlugin,
    swcTransformPlugin,
    transformPlugin: legacyTransformPlugin,
    es5Plugin,
  } = await import('@modern-js/libuild-plugin-swc');
  const {
    checkSwcHelpers,
    matchEs5PluginCondition,
    matchSwcTransformCondition,
  } = await import('../utils/builder');

  const { getProjectTsconfig } = await import('../utils/dts');
  const tsconfigPath = dts
    ? dts.tsconfigPath
    : resolve(appDirectory, 'tsconfig.json');
  const userTsconfig = await getProjectTsconfig(tsconfigPath);

  const plugins = [];

  if (
    matchSwcTransformCondition({
      sourceType,
      buildType,
      format,
      disableSwcTransform,
    })
  ) {
    // TODO: refactor config plugins logic

    const { tsTargetAtOrAboveES2022 } = await import('../utils/dts');
    const tsUseDefineForClassFields =
      userTsconfig?.compilerOptions?.useDefineForClassFields;
    let tsTarget = userTsconfig?.compilerOptions?.target;
    tsTarget = tsTarget ? (tsTarget.toLowerCase() as TsTarget) : undefined;
    let useDefineForClassFields: boolean;
    if (tsUseDefineForClassFields !== undefined) {
      useDefineForClassFields = tsUseDefineForClassFields;
    } else if (tsTarget !== undefined) {
      useDefineForClassFields = tsTargetAtOrAboveES2022(tsTarget);
    } else {
      useDefineForClassFields = true;
    }

    plugins.push(
      swcTransformPlugin({
        pluginImport: transformImport,
        transformLodash,
        externalHelpers: Boolean(externalHelpers),
        emitDecoratorMetadata:
          userTsconfig?.compilerOptions?.emitDecoratorMetadata,
        useDefineForClassFields,
      }),
    );
  } else {
    if (
      matchEs5PluginCondition({
        sourceType,
        buildType,
        format,
        target,
        disableSwcTransform,
      })
    ) {
      plugins.push(es5Plugin());
    }

    if (userTsconfig?.compilerOptions?.emitDecoratorMetadata) {
      plugins.push(
        legacyTransformPlugin({
          jsc: {
            transform: {
              legacyDecorator: true,
              decoratorMetadata: true,
            },
          },
        }),
      );
    }
  }

  if (format === 'umd') {
    plugins.push(umdPlugin(umdModuleName));
  }

  await checkSwcHelpers({ appDirectory, externalHelpers });

  // support svgr
  if (asset.svgr) {
    const { svgrPlugin } = await import('@modern-js/libuild-plugin-svgr');
    const options = typeof asset.svgr === 'boolean' ? {} : asset.svgr;
    plugins.push(svgrPlugin(options));
  }

  // adapt module tools
  const { watchPlugin } = await import('../utils/libuild-plugin');
  plugins.push(watchPlugin(api, config));

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
    redirect,
    bundle: buildType === 'bundle',
    sideEffects,
    // outbase for [dir]/[name]
    outbase: sourceDir,
    esbuildOptions,
  };

  try {
    const { Libuilder } = await import('@modern-js/libuild');
    const { addOutputChunk } = await import('../utils/print');
    const runner = api.useHookRunners();
    const modifiedBuildConfig = await runner.modifyLibuild(buildConfig, {
      onLast: c => c,
    });

    const builder = await Libuilder.create(modifiedBuildConfig);
    await builder.build();
    addOutputChunk(builder.outputChunk, root, buildType === 'bundle');

    if (watch) {
      const { watchSectionTitle } = await import('../utils/log');
      const { SectionTitleStatus } = await import('../constants/log');
      const titleText = `[${
        buildType === 'bundle' ? 'Bundle' : 'Bundleless'
      }: ${format}_${target}]`;

      logger.info(
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
