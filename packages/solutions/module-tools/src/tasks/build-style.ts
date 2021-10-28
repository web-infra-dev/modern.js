import * as path from 'path';
import { fs, Import } from '@modern-js/utils';
import type { NormalizedConfig, IAppContext } from '@modern-js/core';
import type { ICompilerResult, PostcssOption } from '@modern-js/style-compiler';
import type { ModuleToolsOutput } from '../types';

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
const glob: typeof import('glob') = Import.lazy('glob', require);
const hooks: typeof import('@modern-js/module-tools-hooks') = Import.lazy(
  '@modern-js/module-tools-hooks',
  require,
);

const STYLE_DIRS = 'styles';
const SRC_STYLE_DIRS = 'src';

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
  } = modernConfig.output as ModuleToolsOutput;
  const { appDirectory } = appContext;

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

  const { importStyle } = modernConfig.output as ModuleToolsOutput;
  const existStylesDir = checkStylesDirExist({ appDirectory });
  // 编译 styles 目录样式
  if (existStylesDir) {
    const styleResult = await compiler.styleCompiler({
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
    generatorFileOrLogError(
      styleResult!,
      `[Style Compiler] Successfully for 'styles' dir`,
    );
  }

  // 编译 src 内的样式代码
  const srcDir = path.resolve(appDirectory, SRC_STYLE_DIRS);
  const outputDirtoSrc = path.join(
    appDirectory,
    outputPath,
    jsPath,
    assetsPath,
  );
  if (importStyle === 'compiled-code') {
    const srcStyleResult = await compiler.styleCompiler({
      projectDir: appDirectory,
      stylesDir: srcDir,
      outDir: outputDirtoSrc,
      enableVirtualDist: true,
      compilerOption: {
        less: lessOption,
        sass: sassOption,
        postcss: postcssOption,
      },
    });
    generatorFileOrLogError(
      srcStyleResult!,
      `[Style Compiler] Successfully for 'src' dir`,
    );
  } else {
    copyOriginStyleFiles({ targetDir: srcDir, outputDir: outputDirtoSrc });
  }
};

(async () => {
  hooks.buildLifeCycle();
  const { resolved: modernConfig, appContext } = await core.cli.init();
  await core.manager.run(async () => {
    try {
      await taskMain({ modernConfig, appContext });
    } catch (e: any) {
      console.error(e.toString());
    }
  });
})();
