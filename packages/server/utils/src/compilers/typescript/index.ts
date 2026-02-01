import path from 'path';
import { fs, getAliasConfig, logger } from '@modern-js/utils';
import type { ParseConfigFileHost, Program } from 'typescript';
import type ts from 'typescript';
import type { CompileFunc } from '../../common';
import { tsconfigPathsBeforeHookFactory } from './tsconfigPathsPlugin';
import { TypescriptLoader } from './typescriptLoader';

const readTsConfigByFile = (tsConfigFile: string, tsInstance: typeof ts) => {
  const parsedCmd = tsInstance.getParsedCommandLineOfConfigFile(
    tsConfigFile,
    undefined,
    tsInstance.sys as unknown as ParseConfigFileHost,
  );
  const { options, fileNames, projectReferences } = parsedCmd!;
  return { options, fileNames, projectReferences };
};

const copyFiles = async (from: string, to: string, appDirectory: string) => {
  if (await fs.pathExists(from)) {
    const relativePath = path.relative(appDirectory, from);
    const targetDir = path.join(to, relativePath);
    await fs.copy(from, targetDir, {
      filter: src =>
        !['.ts', '.js'].includes(path.extname(src)) &&
        !src.endsWith('tsconfig.json'),
    });
  }
};

export const compileByTs: CompileFunc = async (
  appDirectory,
  config,
  compileOptions,
) => {
  logger.info(`Running ts compile...`);
  const { sourceDirs, distDir, tsconfigPath } = compileOptions;
  if (!tsconfigPath) {
    return;
  }

  const ts = new TypescriptLoader({
    appDirectory,
  }).load();

  const createProgram = ts.createIncrementalProgram || ts.createProgram;
  const formatHost = getFormatHost(ts);

  const { alias } = config;
  const aliasOption = getAliasConfig(alias, {
    appDirectory,
    tsconfigPath,
  });
  const { paths = {}, absoluteBaseUrl = './' } = aliasOption;
  const { options, fileNames, projectReferences } = readTsConfigByFile(
    tsconfigPath,
    ts,
  );

  const sourcePosixPaths = sourceDirs.map(sourceDir =>
    sourceDir.split(path.sep).join(path.posix.sep),
  );
  const rootNames = fileNames.filter(fileName => {
    return (
      fileName.endsWith('.d.ts') ||
      sourcePosixPaths.some(sourceDir => {
        return fileName.includes(sourceDir);
      })
    );
  });

  const program = createProgram.call(ts, {
    rootNames,
    projectReferences,
    options: {
      ...options,
      rootDir: appDirectory,
      outDir: distDir,
    },
  });

  const tsconfigPathsPlugin = tsconfigPathsBeforeHookFactory(
    ts,
    absoluteBaseUrl,
    paths,
  );

  const emitResult = program.emit(undefined, undefined, undefined, undefined, {
    before: [tsconfigPathsPlugin!],
  });

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program as unknown as Program)
    .concat(emitResult.diagnostics);

  const { noEmitOnError } = options;

  if (allDiagnostics.length > 0) {
    logger.error(
      ts.formatDiagnosticsWithColorAndContext(
        [...new Set(allDiagnostics)],
        formatHost,
      ),
    );
    if (typeof noEmitOnError === 'undefined' || noEmitOnError === true) {
      if (compileOptions.throwErrorInsteadOfExit) {
        logger.error('TypeScript compilation failed');
      } else {
        process.exit(1);
      }
    }
  }

  for (const source of sourceDirs) {
    await copyFiles(source, distDir, appDirectory);
  }

  logger.info(`Ts compile succeed`);
};

const getFormatHost = (ts: typeof import('typescript')) => {
  return {
    getCanonicalFileName: (path: string) => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  };
};
