import * as path from 'path';
import { Import, fs } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';
import type { ITsconfig } from '../../types';

const glob: typeof import('glob') = Import.lazy('glob', require);
const babel: typeof import('../../utils/babel') = Import.lazy(
  '../../utils/babel',
  require,
);

const tsPathsTransform: typeof import('../../utils/tspaths-transform') =
  Import.lazy('../../utils/tspaths-transform', require);

const constants: typeof import('../constants') = Import.lazy(
  '../constants',
  require,
);

const deepMerge: typeof import('lodash.merge') = Import.lazy(
  'lodash.merge',
  require,
);

export interface IGeneratorConfig {
  sourceDirName?: string;
  srcDir: string;
  distDir: string;
  projectData: {
    appDirectory: string;
  };
  tsconfigPath?: string;
  tsCheck?: boolean;
  watch?: boolean;
}

export const generatorTsConfig = (
  projectTsconfig: ITsconfig,
  {
    appDirectory,
    distDir,
    sourceDir = 'src',
  }: { appDirectory: string; distDir: string; sourceDir?: string },
) => {
  const tempPath = path.resolve(appDirectory, './node_modules');
  const resolvePath = path.relative(tempPath, appDirectory);
  // const rootDir = projectTsconfig.compilerOptions?.rootDir
  //   ? path.join(resolvePath, projectTsconfig.compilerOptions?.rootDir)
  //   : resolvePath;
  // 目前限制 rootDir 的路径为 sourceDir
  const rootDir = path.join(resolvePath, sourceDir);
  const baseUrl = projectTsconfig.compilerOptions?.baseUrl
    ? path.join(appDirectory, projectTsconfig.compilerOptions?.baseUrl)
    : appDirectory;
  // if include = ['src'], final include should be ['../src']
  const include = projectTsconfig.include?.map(includePath =>
    path.join(resolvePath, includePath),
  );
  const exclude = projectTsconfig.exclude?.map(excludePath =>
    path.join(resolvePath, excludePath),
  );

  const resetConfig: ITsconfig = {
    compilerOptions: {
      rootDir,
      baseUrl,
      // Ensure that .d.ts files are created by tsc, but not .js files
      declaration: true,
      emitDeclarationOnly: true,
      outDir: distDir,
    },
    include,
    exclude,
  };

  const recommendOption = {
    // Ensure that Babel can safely transpile files in the TypeScript project
    compilerOptions: {
      isolatedModules: true,
    },
  };

  const tempTsconfigPath = path.join(tempPath, constants.tempTsconfigName);
  fs.ensureFileSync(tempTsconfigPath);
  fs.writeJSONSync(
    tempTsconfigPath,
    deepMerge(
      recommendOption,
      projectTsconfig,
      // 此处是必须要覆盖用户默认配置
      resetConfig,
    ),
  );
  return tempTsconfigPath;
};

export const resolveAlias = (
  modernConfig: NormalizedConfig,
  config: IGeneratorConfig,
  watchFilenames: string[] = [],
) => {
  const { output } = modernConfig;
  const defaultPaths = { '@': ['./src'] };
  const dtsDistPath = `${config.distDir}/**/*.d.ts`;
  const dtsFilenames =
    watchFilenames.length > 0
      ? watchFilenames
      : glob.sync(dtsDistPath, { absolute: true });
  const alias = babel.getFinalAlias(modernConfig, {
    appDirectory: config.projectData.appDirectory,
    tsconfigPath:
      config.tsconfigPath ||
      path.join(config.projectData.appDirectory, './tsconfig.json'),
    sourceAbsDir: config.distDir,
  });
  const mergedPaths = alias.isTsPath
    ? alias.paths || {}
    : { ...defaultPaths, ...(alias.paths || {}) };
  const result = tsPathsTransform.transformDtsAlias({
    filenames: dtsFilenames,
    baseUrl: path.join(config.projectData.appDirectory, output.path || 'dist'),
    paths: mergedPaths,
  });
  for (const r of result) {
    fs.writeFileSync(r.path, r.content);
  }
};
