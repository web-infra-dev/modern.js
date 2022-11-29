import * as path from 'path';
import {
  fs,
  glob,
  Import,
  watch as watcher,
  WatchChangeType,
  chalk,
  globby,
  slash,
} from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type {
  BuildWatchEmitter,
  ICompilerResult,
  SingleFileCompilerResult,
  LessOption,
  PostcssOption,
  SassOptions,
} from '@modern-js/style-compiler';
import type { Format, Target } from 'src/schema/types';
import { InternalBuildError } from '../error';
import {
  watchSectionTitle,
  SectionTitleStatus,
  getPostcssOption,
} from '../utils';
import type { NormalizedBundlelessBuildConfig } from '../types';

const compiler: typeof import('@modern-js/style-compiler') = Import.lazy(
  '@modern-js/style-compiler',
  require,
);

export class StyleBuildError extends Error {
  public readonly summary?: string;

  public readonly details?: SingleFileCompilerResult[];

  constructor(
    message: string,
    opts?: {
      summary?: string;
      details?: SingleFileCompilerResult[];
    },
  ) {
    super(message);

    Error.captureStackTrace(this, this.constructor);

    this.summary = opts?.summary;
    this.details = opts?.details;
  }

  toString() {
    return this.formatError().join('\n');
  }

  formatError() {
    const msgs: string[] = [];
    const { summary, details = [] } = this;
    msgs.push(chalk.red.bold(summary));

    for (const detail of details) {
      if (detail.error) {
        msgs.push(detail.error);
        msgs.push('\n');
      }
    }

    return msgs;
  }
}

/**
 * when modern build, only throw Error or silent
 * @param result
 * @param context
 */
const generatorFileOrLogError = (
  result: ICompilerResult,
  context: { format: Format; target: Target },
) => {
  if (result.code === 0) {
    for (const file of result.dists) {
      fs.ensureFileSync(file.filename);
      fs.writeFileSync(file.filename, file.content);
    }
  } else {
    // for (const file of result.errors) {
    //   console.error(file.error);
    // }
    const styleError = new StyleBuildError('bundleless failed', {
      summary: 'Style Compiler Failed',
      details: result.errors,
    });
    throw new InternalBuildError(styleError, {
      buildType: 'bundleless',
      ...context,
    });
  }
};

const generatorFileAndLog = (result: ICompilerResult, titleText: string) => {
  if (result.code === 0) {
    for (const file of result.dists) {
      fs.ensureFileSync(file.filename);
      fs.writeFileSync(file.filename, file.content);
    }
    console.info(watchSectionTitle(titleText, SectionTitleStatus.Success));
  } else {
    console.info(watchSectionTitle(titleText, SectionTitleStatus.Fail));
    for (const file of result.errors) {
      console.error(file.error);
    }
  }
};

const copyOriginStyleFiles = ({
  targetDir,
  outputDir,
  ignoreCSS = false,
}: {
  targetDir: string;
  outputDir: string;
  ignoreCSS?: boolean;
}) => {
  const styleFiles = glob.sync(
    `${targetDir}/**/*.{${ignoreCSS ? '' : 'css,'}sass,scss,less}`,
  );
  if (styleFiles.length > 0) {
    fs.ensureDirSync(outputDir);
  }
  for (const styleFile of styleFiles) {
    const file = path.relative(targetDir, styleFile);
    fs.ensureDirSync(path.dirname(path.join(outputDir, file)));
    fs.copyFileSync(styleFile, path.join(outputDir, file));
  }
};

export const runBuild = async (option: {
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
export const styleFileSuffix = ['css', 'less', 'sass', 'scss'];
export const haveNotAnyStyles = async (sourceDir: string) => {
  const files = await globby(
    slash(`${sourceDir}/**/*.{${styleFileSuffix.join(',')}}`),
  );
  return files.length === 0;
};

export const buildStyle = async (
  api: PluginAPI,
  config: NormalizedBundlelessBuildConfig,
) => {
  const modernConfig = api.useResolvedConfigContext() as any;
  const { appDirectory } = api.useAppContext();
  const { watch = false, outputPath, bundlelessOptions } = config;
  const { style, sourceDir } = bundlelessOptions;
  const {
    output: { path: distPath = 'dist' },
  } = modernConfig;
  const titleText = `[Bundleless:Style:${sourceDir}]`;

  if ((await haveNotAnyStyles(sourceDir)) || style.compileMode === false) {
    return;
  }
  const runner: any = api.useHookRunners();

  const lessOption = await runner.moduleLessConfig(
    { modernConfig },
    { onLast: async (_: any) => undefined },
  );
  const sassOption = await runner.moduleSassConfig(
    { modernConfig },
    { onLast: async (_: any) => undefined },
  );
  const tailwindPlugin = await runner.moduleTailwindConfig(
    { modernConfig },
    { onLast: async (_: any) => undefined },
  );
  const postcssOption = getPostcssOption(appDirectory, modernConfig);
  if (tailwindPlugin) {
    postcssOption.plugins?.push(tailwindPlugin);
  }

  const srcDir = path.resolve(appDirectory, sourceDir);
  const outputDirToSrc = path.join(
    appDirectory,
    distPath,
    outputPath,
    style.path ?? './',
  );

  if (
    style.compileMode === 'all' ||
    style.compileMode === 'only-compiled-code'
  ) {
    const result = await runBuild({
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
        (result: ICompilerResult) => {
          generatorFileAndLog(result, titleText);
        },
      );
      emitter.on(
        compiler.BuildWatchEvent.watchingCompiler,
        (srcStyleResult: ICompilerResult) => {
          generatorFileAndLog(srcStyleResult, titleText);
        },
      );
      await emitter.watch();
    } else {
      const srcStyleResult = result as ICompilerResult | undefined;
      generatorFileOrLogError(srcStyleResult!, {
        target: config.target,
        format: config.format,
      });
    }
  }

  if (style.compileMode === 'all' || style.compileMode === 'only-source-code') {
    if (watch) {
      copyOriginStyleFiles({
        targetDir: srcDir,
        outputDir: outputDirToSrc,
        ignoreCSS: style.compileMode === 'all',
      });
      console.info(watchSectionTitle(titleText, SectionTitleStatus.Success));
      watcher(
        `${srcDir}/**/*.{css,less,sass,scss}`,
        ({ changeType, changedFilePath }) => {
          if (changeType === WatchChangeType.UNLINK) {
            const removeFile = path.normalize(
              `${outputDirToSrc}/${path.relative(srcDir, changedFilePath)}`,
            );
            fs.removeSync(removeFile);
          } else {
            copyOriginStyleFiles({
              targetDir: srcDir,
              outputDir: outputDirToSrc,
              ignoreCSS: style.compileMode === 'all',
            });
          }
          console.info(
            watchSectionTitle(titleText, SectionTitleStatus.Success),
          );
        },
      );
    } else {
      copyOriginStyleFiles({
        targetDir: srcDir,
        outputDir: outputDirToSrc,
        ignoreCSS: style.compileMode === 'all',
      });
    }
  }
};
