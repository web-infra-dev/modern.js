/* eslint-disable max-lines */
import * as path from 'path';
import {
  fs,
  glob,
  Import,
  watch as watcher,
  WatchChangeType,
} from '@modern-js/utils';
import type { NormalizedConfig, PluginAPI } from '@modern-js/core';
import type {
  BuildWatchEmitter,
  ICompilerResult,
  LessOption,
  PostcssOption,
  SassOptions,
} from '@modern-js/style-compiler';
import type { NormalizedBundlelessBuildConfig } from '../types';

const cssConfig: typeof import('@modern-js/css-config') = Import.lazy(
  '@modern-js/css-config',
  require,
);
const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const compiler: typeof import('@modern-js/style-compiler') = Import.lazy(
  '@modern-js/style-compiler',
  require,
);

const logger: typeof import('../logger') = Import.lazy('../logger', require);

const STYLE_DIRS = 'styles';

const logCompilerMessage = (compilerMessage: { src: string }) => {
  console.info(logger.clearFlag);
  console.info(compilerMessage.src);
};

const generatorFileOrLogError = (
  result: ICompilerResult,
  successMessage = '',
) => {
  if (result.code === 0 && result.dists.length > 0) {
    for (const file of result.dists) {
      fs.ensureFileSync(file.filename);
      fs.writeFileSync(file.filename, file.content);
    }
    if (successMessage) {
      // console.info(successMessage);
    }
  } else {
    for (const file of result.errors) {
      console.error(file.error);
    }
  }
};

const generatorFileAndReturnLog = (
  result: ICompilerResult,
  successMessage = '',
) => {
  if (result.code === 0) {
    for (const file of result.dists) {
      fs.ensureFileSync(file.filename);
      fs.writeFileSync(file.filename, file.content);
    }
    return successMessage;
  } else {
    return result.errors.join('\n');
  }
};

const getPostcssOption = (
  appDirectory: string,
  modernConfig: NormalizedConfig,
): PostcssOption => {
  const postcssOption = cssConfig.getPostcssConfig(
    appDirectory,
    modernConfig,
    false,
  );
  return {
    plugins: postcssOption?.postcssOptions?.plugins || [],
    enableSourceMap: (postcssOption as any)?.sourceMap || false,
    options: {},
  } as any;
};

const copyOriginStyleFiles = ({
  targetDir,
  outputDir,
}: {
  targetDir: string;
  outputDir: string;
}) => {
  const styleFiles = glob.sync(`${targetDir}/**/*.{css,sass,scss,less}`);
  if (styleFiles.length > 0) {
    fs.ensureDirSync(outputDir);
  }
  for (const styleFile of styleFiles) {
    const file = path.relative(targetDir, styleFile);
    fs.ensureDirSync(path.dirname(path.join(outputDir, file)));
    fs.copyFileSync(styleFile, path.join(outputDir, file));
  }
};

export const buildInStyleDir = async (option: {
  appDirectory: string;
  outDir: string;
  watch: boolean;
  lessOption: LessOption | undefined;
  sassOption: SassOptions<'sync'> | undefined;
  postcssOption: PostcssOption;
}) => {
  const { watch, appDirectory, outDir, lessOption, sassOption, postcssOption } =
    option;
  if (watch) {
    const styleEmitter = compiler.styleCompiler({
      projectDir: appDirectory,
      watch: true,
      stylesDir: path.resolve(appDirectory, STYLE_DIRS),
      outDir,
      enableVirtualDist: true,
      compilerOption: {
        less: lessOption,
        sass: sassOption,
        postcss: postcssOption,
      },
    });
    return styleEmitter;
  } else {
    const styleResult = await compiler.styleCompiler({
      projectDir: appDirectory,
      stylesDir: path.resolve(appDirectory, STYLE_DIRS),
      outDir,
      enableVirtualDist: true,
      compilerOption: {
        less: lessOption,
        sass: sassOption,
        postcss: postcssOption,
      },
    });
    return styleResult;
  }
};

export const buildInSrcDir = async (option: {
  appDirectory: string;
  srcDir: string;
  outDir: string;
  watch: boolean;
  lessOption: LessOption | undefined;
  sassOption: SassOptions<'sync'> | undefined;
  postcssOption: PostcssOption;
}) => {
  const {
    watch,
    appDirectory,
    srcDir,
    outDir,
    lessOption,
    sassOption,
    postcssOption,
  } = option;
  if (watch) {
    const srcStyleEmitter = compiler.styleCompiler({
      watch: true,
      projectDir: appDirectory,
      stylesDir: srcDir,
      outDir,
      enableVirtualDist: true,
      compilerOption: {
        less: lessOption,
        sass: sassOption,
        postcss: postcssOption,
      },
    });
    return srcStyleEmitter;
  } else {
    const srcStyleResult = await compiler.styleCompiler({
      projectDir: appDirectory,
      stylesDir: srcDir,
      outDir,
      enableVirtualDist: true,
      compilerOption: {
        less: lessOption,
        sass: sassOption,
        postcss: postcssOption,
      },
    });
    return srcStyleResult;
  }
};

export const buildStart = async (srcEmitter?: BuildWatchEmitter) => {
  if (srcEmitter) {
    await srcEmitter.watch();
  }
};

export const buildStyle = async (
  api: PluginAPI,
  config: NormalizedBundlelessBuildConfig,
) => {
  const modernConfig = api.useResolvedConfigContext();
  const { appDirectory } = api.useAppContext();
  const { watch = false, outputPath, bundlelessOptions = {} } = config;
  const { style = { path: './', compileMode: 'all' }, sourceDir = './' } =
    bundlelessOptions;
  const {
    output: { path: distPath = 'dist' },
  } = modernConfig;

  if (style.compileMode === false) {
    return;
  }

  const lessOption = await core
    .mountHook()
    .moduleLessConfig(
      { modernConfig },
      { onLast: async (_: any) => undefined },
    );

  const sassOption = await core
    .mountHook()
    .moduleSassConfig(
      { modernConfig },
      { onLast: async (_: any) => undefined },
    );
  const tailwindPlugin = await core
    .mountHook()
    .moduleTailwindConfig(
      { modernConfig },
      { onLast: async (_: any) => undefined },
    );
  const postcssOption = getPostcssOption(appDirectory, modernConfig);
  if (tailwindPlugin) {
    postcssOption.plugins?.push(tailwindPlugin);
  }

  const compilerMessage = {
    src: '',
  };

  const srcDir = path.resolve(appDirectory, sourceDir);
  const outputDirToSrc = path.join(
    appDirectory,
    distPath,
    outputPath,
    style.path ?? './',
  );
  if (
    style.compileMode === 'all' ||
    style.compileMode === 'only-compied-code'
  ) {
    const result = await buildInSrcDir({
      appDirectory,
      srcDir,
      watch,
      outDir: outputDirToSrc,
      lessOption,
      sassOption,
      postcssOption,
    });
    if (watch) {
      const emitter = result as BuildWatchEmitter;
      emitter.on(
        compiler.BuildWatchEvent.firstCompiler,
        (srcStyleResult: ICompilerResult) => {
          compilerMessage.src = generatorFileAndReturnLog(
            srcStyleResult,
            `[Style Compiler] Successfully for '${sourceDir}' dir`,
          );
          logCompilerMessage(compilerMessage);
        },
      );
      emitter.on(compiler.BuildWatchEvent.compilering, () => {
        compilerMessage.src = `[${sourceDir}] Compiling`;
        logCompilerMessage(compilerMessage);
      });
      emitter.on(
        compiler.BuildWatchEvent.watchingCompiler,
        (srcStyleResult: ICompilerResult) => {
          compilerMessage.src = generatorFileAndReturnLog(
            srcStyleResult,
            `[Style Compiler] Successfully for '${sourceDir}' dir`,
          );
          logCompilerMessage(compilerMessage);
        },
      );
      await emitter.watch();
    } else {
      const srcStyleResult = result as ICompilerResult | undefined;
      generatorFileOrLogError(
        srcStyleResult!,
        `[Style Compiler] Successfully for '${sourceDir}' dir`,
      );
    }
  }

  if (style.compileMode === 'all' || style.compileMode === 'only-source-code') {
    if (watch) {
      copyOriginStyleFiles({ targetDir: srcDir, outputDir: outputDirToSrc });
      compilerMessage.src = `[Style Compiler] Successfully for '${sourceDir}' dir`;
      logCompilerMessage(compilerMessage);
      watcher(
        `${srcDir}/**/*.{css,less,sass,scss}`,
        ({ changeType, changedFilePath }) => {
          compilerMessage.src = `['${sourceDir}' dir] Copying in progress`;
          logCompilerMessage(compilerMessage);
          if (changeType === WatchChangeType.UNLINK) {
            const removeFile = path.normalize(
              `${outputDirToSrc}/${path.relative(srcDir, changedFilePath)}`,
            );
            fs.removeSync(removeFile);
          } else {
            copyOriginStyleFiles({
              targetDir: srcDir,
              outputDir: outputDirToSrc,
            });
          }
          compilerMessage.src = `[Style Compiler] Successfully for '${sourceDir}' dir`;
          logCompilerMessage(compilerMessage);
        },
      );
    } else {
      copyOriginStyleFiles({ targetDir: srcDir, outputDir: outputDirToSrc });
    }
  }
};
/* eslint-enable max-lines */
