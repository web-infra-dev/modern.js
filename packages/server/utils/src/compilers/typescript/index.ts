import path from 'path';
import {
  fs,
  getAliasConfig,
  logger,
  readTsConfigByFile as readRawTsConfigByFile,
} from '@modern-js/utils';
import type { ParseConfigFileHost, Program } from 'typescript';
import type ts from 'typescript';
import type { CompileFunc } from '../../common';
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
  const { sourceDirs, distDir, tsconfigPath } = compileOptions;
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
  const entries = compileOptions.entries ?? [];
  // Required entries are compiled even when the frontend tsconfig `files`/`include`
  // leave them out; their imports join the program as usual.
  for (const entry of entries) {
    const posixEntry = entry.split(path.sep).join(path.posix.sep);
    if (!rootNames.includes(posixEntry)) {
      rootNames.push(posixEntry);
    }
  }

  const program = createProgram.call(ts, {
    rootNames,
    projectReferences,
    options: {
      ...options,
      ...getServerEmitOptions(ts, options, entries, compileOptions.moduleType),
      rootDir: appDirectory,
      outDir: distDir,
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

  const missing = entries
    .map(entry => ({
      entry,
      output: getEmittedPath(entry, appDirectory, distDir),
    }))
    .filter(({ output }) => !fs.existsSync(output));
  if (missing.length > 0) {
    throw new Error(
      `TypeScript did not emit ${missing
        .map(
          ({ entry, output }) =>
            `${path.relative(appDirectory, output)} (from ${path.relative(appDirectory, entry)})`,
        )
        .join(', ')}${emitResult.emitSkipped ? ', emit was skipped' : ''}. ` +
        `Check the TypeScript diagnostics above, if any, and the tsconfig at ${tsconfigPath}. ` +
        'Use `server.tsconfigPath` to compile the server with a separate tsconfig.',
    );
  }

  for (const source of sourceDirs) {
    await copyFiles(source, distDir, appDirectory);
  }

  logger.info(`Ts compile succeed`);
};

const ES_MODULE_KINDS = (ts: typeof import('typescript')) => [
  ts.ModuleKind.ES2015,
  ts.ModuleKind.ES2020,
  ts.ModuleKind.ES2022,
  ts.ModuleKind.ESNext,
  ts.ModuleKind.Preserve,
];

/**
 * Options the server compile always needs, whatever the frontend tsconfig says:
 * a frontend tsconfig often only type-checks (`noEmit`, `emitDeclarationOnly`) and
 * targets a bundler (`module: esnext`), but the server output runs in Node directly.
 */
const getServerEmitOptions = (
  ts: typeof import('typescript'),
  options: import('typescript').CompilerOptions,
  entries: string[],
  moduleType: 'module' | 'commonjs' | undefined,
): import('typescript').CompilerOptions => {
  const overrides: import('typescript').CompilerOptions = {
    noEmit: false,
    emitDeclarationOnly: false,
    // A build info file kept outside `distDir` would report the cleaned output as
    // up to date and skip emitting it on the next build.
    incremental: false,
    composite: false,
    tsBuildInfoFile: undefined,
  };
  if (entries.some(entry => /\.(c|m)?jsx?$/.test(entry))) {
    overrides.allowJs = true;
  }
  // `allowImportingTsExtensions` is only valid without emit. TypeScript 5.7+ can emit
  // such imports by rewriting `.ts` specifiers to `.js`. Older versions drop the
  // option, so only files that actually import `.ts` paths report an error.
  if (options.allowImportingTsExtensions) {
    const [major, minor] = ts.versionMajorMinor.split('.').map(Number);
    if (major > 5 || (major === 5 && minor >= 7)) {
      overrides.rewriteRelativeImportExtensions = true;
    } else {
      overrides.allowImportingTsExtensions = false;
    }
  }
  if (
    moduleType !== 'module' &&
    options.module !== undefined &&
    ES_MODULE_KINDS(ts).includes(options.module)
  ) {
    // A commonjs app loads the output with require(), so ES module syntax cannot stay.
    overrides.module = ts.ModuleKind.CommonJS;
    // `verbatimModuleSyntax` forbids rewriting ES module syntax to CommonJS.
    overrides.verbatimModuleSyntax = false;
    if (options.moduleResolution === ts.ModuleResolutionKind.Bundler) {
      overrides.moduleResolution = ts.ModuleResolutionKind.Node10;
      // Options that `node10` resolution does not support.
      overrides.customConditions = undefined;
      overrides.resolvePackageJsonExports = undefined;
      overrides.resolvePackageJsonImports = undefined;
    }
  }
  return overrides;
};

const getEmittedPath = (entry: string, appDirectory: string, distDir: string) =>
  path
    .join(distDir, path.relative(appDirectory, entry))
    .replace(/\.(ts|tsx|js|jsx)$/, '.js')
    .replace(/\.(mts|mjs)$/, '.mjs')
    .replace(/\.(cts|cjs)$/, '.cjs');

const getFormatHost = (ts: typeof import('typescript')) => {
  return {
    getCanonicalFileName: (path: string) => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  };
};
