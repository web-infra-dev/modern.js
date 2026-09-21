import path from 'path';
import {
  fs,
  getAliasConfig,
  logger,
  readTsConfigByFile as readRawTsConfigByFile,
  warnServerTsconfigOverrides,
} from '@modern-js/utils';
import type { ParseConfigFileHost, Program } from 'typescript';
import type ts from 'typescript';
import type { CompileFunc, CompilerOverrides } from '../../common';
import {
  tsconfigPathsAfterDeclarationsHookFactory,
  tsconfigPathsBeforeHookFactory,
} from './tsconfigPathsPlugin';
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

// Look up a numeric TypeScript enum member by its tsconfig spelling
// (`NodeNext`, `nodenext`, ...). Returns undefined for unknown values so an
// unsupported override never silently becomes `0` (ModuleKind.None).
const findEnumValue = (
  enumObject: Record<string, string | number>,
  name: string,
): number | undefined => {
  const wanted = name.toLowerCase();
  for (const key of Object.keys(enumObject)) {
    if (typeof enumObject[key] === 'number' && key.toLowerCase() === wanted) {
      return enumObject[key] as number;
    }
  }
  return undefined;
};

const resolveCompilerOverrides = (
  tsInstance: typeof ts,
  overrides: CompilerOverrides | undefined,
): Partial<ts.CompilerOptions> => {
  const options: Partial<ts.CompilerOptions> = {};
  if (!overrides) {
    return options;
  }
  if (overrides.module) {
    const kind = findEnumValue(
      tsInstance.ModuleKind as unknown as Record<string, string | number>,
      overrides.module,
    );
    if (kind === undefined) {
      throw new Error(
        `Unsupported compilerOverrides.module value: ${overrides.module}`,
      );
    }
    options.module = kind as ts.ModuleKind;
  }
  if (overrides.moduleResolution) {
    const kind = findEnumValue(
      tsInstance.ModuleResolutionKind as unknown as Record<
        string,
        string | number
      >,
      overrides.moduleResolution,
    );
    if (kind === undefined) {
      throw new Error(
        `Unsupported compilerOverrides.moduleResolution value: ${overrides.moduleResolution}`,
      );
    }
    options.moduleResolution = kind as ts.ModuleResolutionKind;
  }
  return options;
};

const copyFiles = async (from: string, to: string, appDirectory: string) => {
  if (await fs.pathExists(from)) {
    const relativePath = path.relative(appDirectory, from);
    const targetDir = path.join(to, relativePath);
    await fs.copy(from, targetDir, {
      filter: src =>
        !['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(src)) &&
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
  const { sourceDirs, distDir, tsconfigPath, compilerOverrides } =
    compileOptions;
  if (!tsconfigPath) {
    return;
  }

  const tsConfig = readRawTsConfigByFile(tsconfigPath);
  const ts = new TypescriptLoader({
    appDirectory,
    compiler: tsConfig['ts-node']?.compiler,
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

  const overrideOptions = resolveCompilerOverrides(ts, compilerOverrides);
  warnServerTsconfigOverrides(tsconfigPath, compilerOverrides);

  const program = createProgram.call(ts, {
    rootNames,
    projectReferences,
    options: {
      ...options,
      ...overrideOptions,
      rootDir: appDirectory,
      outDir: distDir,
      // The server compile is an emit step by definition: the project's main
      // `tsconfig.json` is typically type-check only (`noEmit: true`), which
      // must not leak into the api/ and server/ output.
      noEmit: false,
      emitDeclarationOnly: false,
      // `jsx: preserve` emits `.jsx` files, which Node cannot execute and which
      // the emitted specifiers (always `.js`) would not point at. Server output
      // has to run in Node directly, so JSX must be transformed here.
      jsx:
        options.jsx === undefined || options.jsx === ts.JsxEmit.Preserve
          ? ts.JsxEmit.ReactJSX
          : options.jsx,
    },
  });

  const tsconfigPathsPlugin = tsconfigPathsBeforeHookFactory(
    ts,
    absoluteBaseUrl,
    paths,
    compileOptions.moduleType,
  );

  // tsc keeps path aliases verbatim in `.d.ts` output, so the same rewrite has
  // to run on declaration emit or aliased specifiers leak to consumers.
  const tsconfigPathsDeclarationPlugin =
    tsconfigPathsAfterDeclarationsHookFactory(
      ts,
      absoluteBaseUrl,
      paths,
      compileOptions.moduleType,
    );

  const emitResult = program.emit(undefined, undefined, undefined, undefined, {
    before: tsconfigPathsPlugin ? [tsconfigPathsPlugin] : [],
    afterDeclarations: tsconfigPathsDeclarationPlugin
      ? [tsconfigPathsDeclarationPlugin]
      : [],
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
