import { join, dirname, isAbsolute, relative, resolve, basename } from 'path';
import {
  chalk,
  fs,
  globby,
  json5,
  logger,
  nanoid,
  slash,
} from '@modern-js/utils';
import MagicString from 'magic-string';
import type {
  ITsconfig,
  GeneratorDtsConfig,
  BuildType,
  TsTarget,
} from '../types';

export const getProjectTsconfig = async (
  tsconfigPath: string,
): Promise<ITsconfig> => {
  if (!fs.existsSync(tsconfigPath)) {
    return {};
  }

  return json5.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
};

export const generateDtsInfo = async (config: GeneratorDtsConfig) => {
  const { appDirectory, sourceDir: absSourceDir, tsconfigPath } = config;

  const userTsconfig = await getProjectTsconfig(tsconfigPath);
  const { dtsTempDirectory } = await import('../constants/dts');

  const tempDistAbsRootPath = join(
    appDirectory,
    `${dtsTempDirectory}/${nanoid()}`,
  );
  const tempDistAbsOurDir = join(
    tempDistAbsRootPath,
    relative(appDirectory, absSourceDir),
  );

  const tempTsconfigPath = join(tempDistAbsRootPath, basename(tsconfigPath));
  fs.ensureFileSync(tempTsconfigPath);

  const extendsPath = join(
    relative(dirname(tempTsconfigPath), dirname(tsconfigPath)),
    basename(tempTsconfigPath),
  );
  const references = userTsconfig?.references?.map(reference => {
    const { path } = reference;
    if (path) {
      const userTsconfigDir = dirname(tsconfigPath);
      const generatedTsconfigDir = dirname(tempTsconfigPath);
      return {
        path: isAbsolute(path)
          ? path
          : relative(generatedTsconfigDir, resolve(userTsconfigDir, path)),
      };
    }
    return reference;
  });

  const resetConfig: ITsconfig = {
    extends: extendsPath,
    compilerOptions: {
      // Ensure that .d.ts files are created by tsc, but not .js files
      declaration: true,
      emitDeclarationOnly: true,
      // when `outDir` is './dist', `declarationDir` is `./types`
      // tsc will emit:
      // - ./dist/index.js
      // - ./types/index.d.ts
      // we only want to emit declarations
      declarationDir: tempDistAbsOurDir,
    },
    references,
  };

  fs.writeJSONSync(tempTsconfigPath, resetConfig);

  return {
    userTsconfig,
    tempTsconfigPath,
    tempDistAbsRootPath,
    tempDistAbsSrcPath: tempDistAbsOurDir,
  };
};

export const getTscBinPath = async (appDirectory: string) => {
  const { default: findUp, exists: pathExists } = await import(
    '../../compiled/find-up'
  );
  const tscBinFile = await findUp(
    async (directory: string) => {
      const targetFilePath = join(directory, './node_modules/.bin/tsc');
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
  config: GeneratorDtsConfig,
  options: {
    userTsconfig: ITsconfig;
    tempTsconfigPath: string;
    tempDistAbsRootPath: string;
    tempDistAbsSrcPath: string;
  },
  watchFilenames: string[] = [],
) => {
  const { userTsconfig, tempDistAbsSrcPath, tempDistAbsRootPath } = options;
  const { transformDtsAlias } = await import('./tspath');
  const dtsDistPath = `${slash(tempDistAbsSrcPath)}/**/*.d.ts`;
  const dtsFilenames =
    watchFilenames.length > 0
      ? watchFilenames
      : globby.sync(dtsDistPath, { absolute: true });
  const result = transformDtsAlias({
    filenames: dtsFilenames,
    baseUrl: tempDistAbsRootPath,
    paths: userTsconfig.compilerOptions?.paths ?? {},
  });
  return result;
};

export const writeDtsFiles = async (
  config: GeneratorDtsConfig,
  options: {
    userTsconfig: ITsconfig;
    tempTsconfigPath: string;
    tempDistAbsRootPath: string;
    tempDistAbsSrcPath: string;
  },
  result: { path: string; content: string }[],
) => {
  const { distPath } = config;
  const { tempDistAbsSrcPath } = options;

  for (const r of result) {
    fs.writeFileSync(r.path, r.content);
  }

  // why use `ensureDir` before copy? look this: https://github.com/jprichardson/node-fs-extra/issues/957
  await fs.ensureDir(distPath);
  await fs.copy(tempDistAbsSrcPath, distPath);
};

export const addBannerAndFooter = (
  result: { path: string; content: string }[],
  banner?: string,
  footer?: string,
) => {
  return result.map(({ path, content }) => {
    const ms = new MagicString(content);
    banner && ms.prepend(`${banner}\n`);
    footer && ms.append(`\n${footer}\n`);
    return {
      path,
      content: ms.toString(),
    };
  });
};

export const printOrThrowDtsErrors = async (
  error: unknown,
  options: { abortOnError?: boolean; buildType: BuildType },
) => {
  const { InternalDTSError } = await import('../error');
  const local = await import('../locale');
  const { abortOnError, buildType } = options ?? {};
  if (error instanceof Error) {
    if (abortOnError) {
      throw new InternalDTSError(error, {
        buildType,
      });
    } else {
      logger.warn(
        chalk.bgYellowBright(
          local.i18n.t(local.localeKeys.warns.dts.abortOnError),
        ),
      );
      logger.error(
        new InternalDTSError(error, {
          buildType,
        }),
      );
    }
  }
};

export const tsTargetAtOrAboveES2022 = (target: TsTarget) =>
  target === 'es2022' || target === 'esnext';
