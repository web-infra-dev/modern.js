import path from 'path';
import t from '@babel/types';
import type * as tt from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type {
  ITsconfig,
  BundlelessGeneratorDtsConfig,
  BuildCommandOptions,
  BaseBuildConfig,
  AliasOption,
} from '../types';

export const generatorTsConfig = async (
  projectTsconfig: ITsconfig,
  config: BundlelessGeneratorDtsConfig,
) => {
  const { nanoid, fs, lodash } = await import('@modern-js/utils');

  const { appDirectory, sourceDir, distAbsPath, tsconfigPath } = config;
  const tempPath = path.resolve(appDirectory, './node_modules');
  const resolvePath = path.relative(tempPath, sourceDir);

  const rootDir = resolvePath;
  const baseUrl = projectTsconfig.compilerOptions?.baseUrl
    ? path.join(appDirectory, projectTsconfig.compilerOptions?.baseUrl)
    : appDirectory;
  // if include = ['src'], final include should be ['../src']
  const include = [resolvePath];

  const resetConfig: ITsconfig = {
    compilerOptions: {
      rootDir,
      baseUrl,
      // Ensure that .d.ts files are created by tsc, but not .js files
      declaration: true,
      emitDeclarationOnly: true,
      outDir: distAbsPath,
    },
    include,
    exclude: projectTsconfig.exclude ?? [],
  };

  // extends: '../tsconfig.json'
  if (projectTsconfig.extends) {
    resetConfig.extends = projectTsconfig.extends.startsWith('.')
      ? path.join(
          path.relative(`${tempPath}/tsconfig.json`, tsconfigPath),
          projectTsconfig.extends,
        )
      : projectTsconfig.extends;
  }

  const recommendOption = {
    // Ensure that Babel can safely transpile files in the TypeScript project
    compilerOptions: {
      isolatedModules: true,
    },
  };

  const tempTsconfigPath = path.join(
    tempPath,
    `tsconfig.${Date.now()}.${nanoid()}.json`,
  );
  fs.ensureFileSync(tempTsconfigPath);

  const deepMerge = lodash.merge;
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

export const getTscBinPath = async (appDirectory: string) => {
  const { fs } = await import('@modern-js/utils');
  const tscBinFile = path.join(appDirectory, './node_modules/.bin/tsc');

  if (!fs.existsSync(tscBinFile)) {
    throw new Error(
      'Failed to excute the `tsc` command, please check if `typescript` is installed correctly in the current directory.',
    );
  }

  return tscBinFile;
};

export const resolveAlias = async (
  config: BundlelessGeneratorDtsConfig,
  watchFilenames: string[] = [],
) => {
  const { globby, fs } = await import('@modern-js/utils');
  const { getFinalAlias } = await import('./babel');
  const { transformDtsAlias } = await import('./tspaths-transform');
  const { distAbsPath, alias } = config;
  const defaultPaths = { '@': ['./src'] };
  const dtsDistPath = `${distAbsPath}/**/*.d.ts`;
  const dtsFilenames =
    watchFilenames.length > 0
      ? watchFilenames
      : globby.sync(dtsDistPath, { absolute: true });
  const finalAlias = await getFinalAlias(alias, config);
  const mergedPaths = finalAlias.isTsPath
    ? finalAlias.paths || {}
    : { ...defaultPaths, ...(finalAlias.paths || {}) };
  const result = transformDtsAlias({
    filenames: dtsFilenames,
    baseUrl: distAbsPath,
    paths: mergedPaths,
  });
  for (const r of result) {
    fs.writeFileSync(r.path, r.content);
  }
};

export const matchesPattern = (calleePath: NodePath, pattern: string) => {
  const { node } = calleePath;

  if (t.isMemberExpression(node)) {
    return calleePath.matchesPattern(pattern);
  }

  if (!t.isIdentifier(node) || pattern.includes('.')) {
    return false;
  }

  const name = pattern.split('.')[0];

  return node.name === name;
};

export const isImportCall = (calleePath: NodePath<tt.CallExpression>) => {
  return t.isImport(calleePath.node.callee);
};

export const verifyTsConfigPaths = async (
  tsconfigAbsPath: string,
  userAliases?: AliasOption,
) => {
  const { readTsConfigByFile, chalk } = await import('@modern-js/utils');
  if (!userAliases) {
    return;
  }

  const paths = Object.keys(
    readTsConfigByFile(tsconfigAbsPath).compilerOptions?.paths || {},
  ).map(key => key.replace(/\/\*$/, ''));

  Object.keys(userAliases).forEach(name => {
    if (paths.includes(name)) {
      throw new Error(
        chalk.red(
          `It looks like you have configured the alias ${chalk.bold(
            name,
          )} in both the modern.config file and tsconfig.json.\n Please remove the configuration in modern.config file and just keep the configuration in tsconfig.json.`,
        ),
      );
    }
  });
};

export const assignTsConfigPath = async (
  config: BaseBuildConfig,
  options: BuildCommandOptions,
) => {
  const { defaultTsConfigPath } = await import('../constants/dts');

  // user run `build --tsconfig './tsconfig.build.json'`
  if (
    typeof options.tsconfig === 'string' &&
    options.tsconfig !== defaultTsConfigPath
  ) {
    config.dts = {
      only: false,
      distPath: './',
      ...(config.dts ?? {}),
      tsconfigPath: options.tsconfig,
    };
  }

  return config;
};
