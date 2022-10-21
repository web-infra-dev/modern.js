import path from 'path';
import type { NodePath } from '../../compiled/@babel/traverse';
import type * as tt from '../../compiled/@babel/types';
import t from '../../compiled/@babel/types';
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
  const { fs, lodash, nanoid } = await import('@modern-js/utils');
  const { dtsTempDirectory } = await import('../constants/dts');

  const {
    appDirectory,
    sourceDir: absSourceDir,
    distAbsPath,
    tsconfigPath,
  } = config;
  const tempDistAbsRootPath = path.join(
    appDirectory,
    `${dtsTempDirectory}/${nanoid()}`,
  );
  const tempDistAbsSrcPath = path.join(
    tempDistAbsRootPath,
    path.relative(appDirectory, absSourceDir),
  );

  const rootDir = path.relative(tempDistAbsRootPath, appDirectory);
  const baseUrl = projectTsconfig.compilerOptions?.baseUrl
    ? path.join(appDirectory, projectTsconfig.compilerOptions?.baseUrl)
    : appDirectory;
  // if include = ['src'], final include should be ['../src']
  const include = [path.relative(tempDistAbsRootPath, absSourceDir)];

  const resetConfig: ITsconfig = {
    compilerOptions: {
      ...projectTsconfig?.compilerOptions,
      rootDir,
      baseUrl,
      // Ensure that .d.ts files are created by tsc, but not .js files
      declaration: true,
      emitDeclarationOnly: true,
      outDir: tempDistAbsRootPath,
    },
    include,
    exclude: projectTsconfig.exclude ?? [],
  };

  // extends: '../tsconfig.json'
  if (projectTsconfig.extends) {
    resetConfig.extends = projectTsconfig.extends.startsWith('.')
      ? path.join(
          path.relative(`${distAbsPath}/tsconfig.json`, tsconfigPath),
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

  const tempTsconfigPath = path.join(tempDistAbsRootPath, `tsconfig.json`);
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

  return { tempTsconfigPath, tempDistAbsRootPath, tempDistAbsSrcPath };
};

export const getTscBinPath = async (appDirectory: string) => {
  const { fs } = await import('@modern-js/utils');
  const { default: findUp, exists: pathExists } = await import('find-up');
  const tscBinFile = await findUp(
    async directory => {
      const targetFilePath = path.join(directory, './node_modules/.bin/tsc');
      const hasTscBinFile = await pathExists(targetFilePath);
      if (hasTscBinFile) {
        return targetFilePath;
      }
      return undefined;
    },
    { cwd: appDirectory },
  );

  if (!tscBinFile || !fs.existsSync(tscBinFile)) {
    throw new Error(
      'Failed to excute the `tsc` command, please check if `typescript` is installed correctly in the current directory.',
    );
  }

  return tscBinFile;
};

export const resolveAlias = async (
  config: BundlelessGeneratorDtsConfig,
  options: {
    userTsconfig: ITsconfig;
    tempTsconfigPath: string;
    tempDistAbsRootPath: string;
    tempDistAbsSrcPath: string;
  },
  watchFilenames: string[] = [],
) => {
  const { userTsconfig, tempDistAbsSrcPath, tempDistAbsRootPath } = options;
  const { globby, fs } = await import('@modern-js/utils');
  const { transformDtsAlias } = await import('./tspaths-transform');
  const { distAbsPath } = config;
  const dtsDistPath = `${tempDistAbsSrcPath}/**/*.d.ts`;
  const dtsFilenames =
    watchFilenames.length > 0
      ? watchFilenames
      : globby.sync(dtsDistPath, { absolute: true });
  const result = transformDtsAlias({
    filenames: dtsFilenames,
    baseUrl: tempDistAbsRootPath,
    paths: userTsconfig.compilerOptions?.paths ?? {},
  });
  for (const r of result) {
    fs.writeFileSync(r.path, r.content);
  }

  await fs.copy(tempDistAbsSrcPath, distAbsPath);
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
