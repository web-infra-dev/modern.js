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
const SRC_STYLE_DIRS = 'src';

const logCompilerMessage = (compilerMessage: {
  src: string;
  styles: string;
}) => {
  console.info(logger.clearFlag);
  console.info(compilerMessage.src);
  console.info(compilerMessage.styles);
};

const checkStylesDirExist = (option: { appDirectory: string }) => {
  const { appDirectory } = option;
  return fs.existsSync(path.join(appDirectory, STYLE_DIRS));
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
      console.info(successMessage);
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

export const buildStart = async (
  styleEmitter?: BuildWatchEmitter,
  srcEmitter?: BuildWatchEmitter,
) => {
  if (styleEmitter) {
    await styleEmitter.watch();
  }

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
  const { watch, outputPath, outputStylePath } = config;
  const {
    output: { path: distPath = 'dist' },
  } = modernConfig;
  const styleDefaultDir = 'styles';
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

  const { importStyle } = modernConfig.output;
  const existStylesDir = checkStylesDirExist({ appDirectory });
  const compilerMessage = {
    src: '',
    styles: '',
  };
  let startFun = buildStart.bind(null);
  // compiler style dir. In the new mode, the following logic will not be run
  if (existStylesDir && outputStylePath) {
    const result = await buildInStyleDir({
      appDirectory,
      watch,
      outDir: path.join(appDirectory, distPath, 'styles'),
      lessOption,
      sassOption,
      postcssOption,
    });
    if (watch) {
      const styleEmitter = result as BuildWatchEmitter;
      styleEmitter.on(
        compiler.BuildWatchEvent.firstCompiler,
        (styleResult: ICompilerResult) => {
          compilerMessage.styles = generatorFileAndReturnLog(
            styleResult,
            `[Style Compiler] Successfully for 'styles' dir`,
          );
          logCompilerMessage(compilerMessage);
        },
      );
      styleEmitter.on(compiler.BuildWatchEvent.compilering, () => {
        compilerMessage.styles = `[${styleDefaultDir}] Compiling...`;
        logCompilerMessage(compilerMessage);
      });
      styleEmitter.on(
        compiler.BuildWatchEvent.watchingCompiler,
        (styleResult: ICompilerResult) => {
          compilerMessage.styles = generatorFileAndReturnLog(
            styleResult,
            `[Style Compiler] Successfully for 'styles' dir`,
          );
          logCompilerMessage(compilerMessage);
        },
      );
      startFun = startFun.bind(null, styleEmitter);
    } else {
      const styleResult = result as ICompilerResult | undefined;
      generatorFileOrLogError(
        styleResult!,
        `[Style Compiler] Successfully for 'styles' dir`,
      );
    }
  }

  // compiler src dir
  const srcDir = path.resolve(appDirectory, SRC_STYLE_DIRS);
  const outputDirToSrc = outputStylePath
    ? path.join(appDirectory, distPath, outputStylePath)
    : path.join(appDirectory, distPath, outputPath, 'styles');
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
    const srcStyleEmitter = result as BuildWatchEmitter;
    if (importStyle === 'compiled-code') {
      srcStyleEmitter.on(
        compiler.BuildWatchEvent.firstCompiler,
        (srcStyleResult: ICompilerResult) => {
          compilerMessage.src = generatorFileAndReturnLog(
            srcStyleResult,
            `[Style Compiler] Successfully for 'src' dir`,
          );
          logCompilerMessage(compilerMessage);
        },
      );
      srcStyleEmitter.on(compiler.BuildWatchEvent.compilering, () => {
        compilerMessage.src = `[src] Compiling`;
        logCompilerMessage(compilerMessage);
      });
      srcStyleEmitter.on(
        compiler.BuildWatchEvent.watchingCompiler,
        (srcStyleResult: ICompilerResult) => {
          compilerMessage.src = generatorFileAndReturnLog(
            srcStyleResult,
            `[Style Compiler] Successfully for 'src' dir`,
          );
          logCompilerMessage(compilerMessage);
        },
      );
      startFun = startFun.bind(null, srcStyleEmitter);
    } else {
      compilerMessage.src = `['src' dir] Copying in progress`;
      logCompilerMessage(compilerMessage);
      copyOriginStyleFiles({ targetDir: srcDir, outputDir: outputDirToSrc });
      compilerMessage.src = `[Style Compiler] Successfully for 'src' dir`;
      logCompilerMessage(compilerMessage);
      watcher(
        `${srcDir}/**/*.{css,less,sass,scss}`,
        ({ changeType, changedFilePath }) => {
          compilerMessage.src = `['src' dir] Copying in progress`;
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
          compilerMessage.src = `[Style Compiler] Successfully for 'src' dir`;
          logCompilerMessage(compilerMessage);
        },
      );
    }
    await startFun();
  } else {
    const srcStyleResult = result as ICompilerResult | undefined;
    if (importStyle === 'compiled-code') {
      generatorFileOrLogError(
        srcStyleResult!,
        `[Style Compiler] Successfully for 'src' dir`,
      );
    } else {
      copyOriginStyleFiles({ targetDir: srcDir, outputDir: outputDirToSrc });
    }
  }
};
/* eslint-enable max-lines */
