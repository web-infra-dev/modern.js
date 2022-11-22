import path from 'path';
import { logger, getAlias, fs } from '@modern-js/utils';
import type { Program } from 'typescript';
import ts from 'typescript';
import type { CompileFunc } from '../../common';
import { TypescriptLoader } from './typescript-loader';
import { tsconfigPathsBeforeHookFactory } from './tsconfig-paths-plugin';

const readTsConfigByFile = (tsConfigFile: string) => {
  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    tsConfigFile,
    undefined,
    ts.sys as unknown as ts.ParseConfigFileHost,
  );
  const { options, fileNames, projectReferences } = parsedCmd!;
  return { options, fileNames, projectReferences };
};

const copyFiles = async (from: string, to: string, tsconfigPath: string) => {
  if (await fs.pathExists(from)) {
    const basename = path.basename(from);
    const targetDir = path.join(to, basename);
    await fs.copy(from, targetDir, {
      filter: src =>
        !['.ts'].includes(path.extname(src)) && src !== tsconfigPath,
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
  const aliasOption = getAlias(alias || {}, {
    appDirectory,
    tsconfigPath,
  });
  const { paths = {}, absoluteBaseUrl = './' } = aliasOption;
  const { options, fileNames, projectReferences } =
    readTsConfigByFile(tsconfigPath);

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
      rootDir: appDirectory,
      outDir: distDir,
      ...options,
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

  if (allDiagnostics.length > 0) {
    logger.error(
      ts.formatDiagnosticsWithColorAndContext(allDiagnostics, formatHost),
    );
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  for (const source of sourceDirs) {
    await copyFiles(source, distDir, tsconfigPath);
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
