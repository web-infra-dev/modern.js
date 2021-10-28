/* eslint-disable max-statements */
import * as path from 'path';
import type { NormalizedConfig, IAppContext } from '@modern-js/core';
import type { ICompilerResult, PostcssOption } from '@modern-js/style-compiler';
import { fs, watch, WatchChangeType, Import } from '@modern-js/utils';
import type { ModuleToolsOutput } from '../types';

const logger: typeof import('../features/build/logger') = Import.lazy(
  '../features/build/logger',
  require,
);
const cssConfig: typeof import('@modern-js/css-config') = Import.lazy(
  '@modern-js/css-config',
  require,
);
const hooks: typeof import('@modern-js/module-tools-hooks') = Import.lazy(
  '@modern-js/module-tools-hooks',
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
const glob: typeof import('glob') = Import.lazy('glob', require);

const STYLE_DIRS = 'styles';
const SRC_STYLE_DIRS = 'src';

const checkStylesDirExist = (option: { appDirectory: string }) => {
  const { appDirectory } = option;
  return fs.existsSync(path.join(appDirectory, STYLE_DIRS));
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
    fs.copyFileSync(styleFile, path.join(outputDir, file));
  }
};

const logCompilerMessage = (compilerMessage: {
  src: string;
  styles: string;
}) => {
  console.info(logger.clearFlag);
  console.info(compilerMessage.src);
  console.info(compilerMessage.styles);
};

const taskMain = async ({
  modernConfig,
  appContext,
}: {
  modernConfig: NormalizedConfig;
  appContext: IAppContext;
}) => {
  const {
    assetsPath = 'styles',
    path: outputPath = 'dist',
    jsPath = 'js',
    importStyle,
  } = modernConfig.output as ModuleToolsOutput;
  const { appDirectory } = appContext;

  const lessOption = await (core.mountHook() as any).moduleLessConfig({
    onLast: async (_: any) => null as any,
  });
  const sassOption = await (core.mountHook() as any).moduleSassConfig({
    onLast: async (_: any) => null as any,
  });
  const postcssOption = getPostcssOption(appDirectory, modernConfig);
  const existStylesDir = checkStylesDirExist({ appDirectory });
  const compilerMessage = {
    src: '',
    styles: '',
  };

  // 编译 styles 目录样式
  let styleEmitter = null;
  if (existStylesDir) {
    styleEmitter = compiler.styleCompiler({
      watch: true,
      projectDir: appDirectory,
      stylesDir: path.resolve(appDirectory, STYLE_DIRS),
      outDir: path.join(appDirectory, outputPath, assetsPath),
      enableVirtualDist: true,
      compilerOption: {
        less: lessOption,
        sass: sassOption,
        postcss: postcssOption,
      },
    });
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
      compilerMessage.styles = `[${assetsPath}] Compiling...`;
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
    // await styleEmitter.watch();
  }
  // 编译 src 内的样式代码
  const srcDir = path.resolve(appDirectory, SRC_STYLE_DIRS);
  const outputDirToSrc = path.join(
    appDirectory,
    outputPath,
    jsPath,
    assetsPath,
  );
  if (importStyle === 'compiled-code') {
    compilerMessage.src = `[src] Compiling`;
    const srcStyleEmitter = compiler.styleCompiler({
      watch: true,
      projectDir: appDirectory,
      stylesDir: srcDir,
      outDir: outputDirToSrc,
      enableVirtualDist: true,
      compilerOption: {
        less: lessOption,
        sass: sassOption,
        postcss: postcssOption,
      },
    });
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
    styleEmitter && (await styleEmitter.watch());
    await srcStyleEmitter.watch();
  } else {
    compilerMessage.src = `['src' dir] Copying in progress`;
    styleEmitter && (await styleEmitter.watch());
    logCompilerMessage(compilerMessage);
    copyOriginStyleFiles({ targetDir: srcDir, outputDir: outputDirToSrc });
    compilerMessage.src = `[Style Compiler] Successfully for 'src' dir`;
    logCompilerMessage(compilerMessage);
    watch(
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
};

(async () => {
  hooks.buildLifeCycle();
  const { resolved: modernConfig, appContext } = await core.cli.init();
  await core.manager.run(async () => {
    try {
      await taskMain({ modernConfig, appContext });
    } catch (e: any) {
      console.error(e.message);
    }
  });
})();
/* eslint-enable max-statements */
