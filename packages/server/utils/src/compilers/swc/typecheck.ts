import { spawnSync } from 'child_process';
import path from 'path';
import {
  fs,
  logger,
  readTsConfigByFile,
  readTsConfigWithExtends,
} from '@modern-js/utils';
import type { CompilerOverrides } from '../../common';

// Values accepted for the overrides the framework passes. Anything else is a
// framework bug, so it fails loudly instead of reaching tsc.
const MODULE_KINDS = new Set([
  'none',
  'commonjs',
  'amd',
  'umd',
  'system',
  'es6',
  'es2015',
  'es2020',
  'es2022',
  'esnext',
  'node16',
  'node18',
  'node20',
  'nodenext',
  'preserve',
]);
const MODULE_RESOLUTION_KINDS = new Set([
  'classic',
  'node',
  'node10',
  'node16',
  'nodenext',
  'bundler',
]);

export const validateCompilerOverrides = (
  overrides: CompilerOverrides | undefined,
) => {
  if (overrides?.module && !MODULE_KINDS.has(overrides.module.toLowerCase())) {
    throw new Error(
      `Unsupported compilerOverrides.module value: ${overrides.module}`,
    );
  }
  if (
    overrides?.moduleResolution &&
    !MODULE_RESOLUTION_KINDS.has(overrides.moduleResolution.toLowerCase())
  ) {
    throw new Error(
      `Unsupported compilerOverrides.moduleResolution value: ${overrides.moduleResolution}`,
    );
  }
};

interface TypeScriptPackage {
  tsc: string;
  version: string;
}

/** The project's own `typescript`, run as a command so TS 7 works too. */
export const findProjectTypeScript = (
  appDirectory: string,
): TypeScriptPackage | undefined => {
  try {
    const pkgPath = require.resolve('typescript/package.json', {
      paths: [appDirectory],
    });
    const { version, bin } = fs.readJSONSync(pkgPath);
    const relativeBin = typeof bin === 'string' ? bin : bin?.tsc;
    if (!relativeBin) {
      return undefined;
    }
    return { tsc: path.join(path.dirname(pkgPath), relativeBin), version };
  } catch {
    return undefined;
  }
};

// `include` / `files` are inherited from the nearest config that declares
// them, so look them up along the `extends` chain, entry file first.
export const findNearest = (
  configFiles: string[],
  key: 'include' | 'files' | 'exclude',
) => {
  for (const file of [...configFiles].reverse()) {
    const raw = readTsConfigByFile(file);
    if (Array.isArray(raw?.[key])) {
      return { dir: path.dirname(file), entries: raw[key] as string[] };
    }
  }
  return undefined;
};

const isDeclarationEntry = (entry: string) => entry.endsWith('.d.ts');

// tsconfig `include` globs only understand forward slashes.
const toPosix = (file: string) => file.replace(/\\/g, '/');

export interface TypeCheckOptions {
  appDirectory: string;
  tsconfigPath: string;
  sourceDirs: string[];
  distDir: string;
  /** The files the compile emits; tsc follows their imports itself. */
  programFiles: string[];
  compilerOverrides?: CompilerOverrides;
  /** Emit `.d.ts` next to the compiled output. */
  declaration: boolean;
  /** Emit the JavaScript too, so tsc compiles the server code itself. */
  emit?: boolean;
  /** `jsx` forced onto the program, as the in-process compile did. */
  jsx?: string;
}

/**
 * Write the tsconfig the server type check runs with: it extends the server
 * tsconfig, checks the compiled files plus the project's ambient `.d.ts`
 * files (the program the in-process compile used to build), and turns emit
 * off except for declarations.
 */
export const writeTypeCheckConfig = (
  options: TypeCheckOptions,
  typescriptVersion: string,
) => {
  const {
    appDirectory,
    tsconfigPath,
    distDir,
    programFiles,
    compilerOverrides,
    declaration,
    emit = false,
    jsx,
  } = options;
  const { files: configFiles } = readTsConfigWithExtends(tsconfigPath);

  const include: string[] = [];
  const nearestInclude = findNearest(configFiles, 'include');
  for (const entry of nearestInclude?.entries ?? []) {
    const absolute = path.resolve(nearestInclude!.dir, entry);
    include.push(
      toPosix(
        isDeclarationEntry(entry) ? absolute : path.join(absolute, '**/*.d.ts'),
      ),
    );
  }
  const nearestFiles = findNearest(configFiles, 'files');
  const files = [
    ...programFiles.map(toPosix),
    ...(nearestFiles?.entries ?? [])
      .filter(isDeclarationEntry)
      .map(entry => toPosix(path.resolve(nearestFiles!.dir, entry))),
  ];

  const major = Number(typescriptVersion.split('.')[0]);
  const config = {
    extends: toPosix(path.resolve(tsconfigPath)),
    compilerOptions: {
      ...compilerOverrides,
      // TS5101 and the other TypeScript 6 deprecations only concern the
      // project's own config check; they must not fail the server build.
      ...(major === 6 ? { ignoreDeprecations: '6.0' } : {}),
      noEmit: !emit && !declaration,
      emitDeclarationOnly: !emit && declaration,
      declaration,
      ...(emit || declaration
        ? { rootDir: appDirectory, outDir: distDir }
        : {}),
      ...(declaration ? { declarationDir: distDir } : {}),
      ...(jsx ? { jsx } : {}),
      incremental: false,
      composite: false,
    },
    include,
    files,
  };

  const configPath = path.join(
    appDirectory,
    `node_modules/.cache/modern-js/tsconfig.server-${emit ? 'build' : 'check'}.json`,
  );
  fs.outputJSONSync(configPath, config, { spaces: 2 });
  return configPath;
};

export interface TypeCheckResult {
  ok: boolean;
  output: string;
  /** Absolute paths of the files tsc wrote. */
  emitted: string[];
}

const EMITTED_PREFIX = 'TSFILE: ';

/** Run the project's tsc on the server code; undefined when not installed. */
export const runTypeCheck = (
  options: TypeCheckOptions,
): TypeCheckResult | undefined => {
  const typescript = findProjectTypeScript(options.appDirectory);
  if (!typescript) {
    return undefined;
  }
  if (options.programFiles.length === 0) {
    return { ok: true, output: '', emitted: [] };
  }
  const configPath = writeTypeCheckConfig(options, typescript.version);
  const result = spawnSync(
    process.execPath,
    [typescript.tsc, '-p', configPath, '--pretty', '--listEmittedFiles'],
    // tsc can print far more than spawnSync's 1MB default on a large project;
    // past the limit the child is killed and the diagnostics are lost.
    {
      cwd: options.appDirectory,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    },
  );
  const emitted: string[] = [];
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    .split('\n')
    .filter(line => {
      if (line.startsWith(EMITTED_PREFIX)) {
        emitted.push(path.resolve(line.slice(EMITTED_PREFIX.length).trim()));
        return false;
      }
      return true;
    })
    .join('\n')
    .trim();
  return {
    ok: result.status === 0,
    emitted,
    output: result.error
      ? `${output}\n${result.error.message}`.trim()
      : output ||
        (result.status === 0
          ? ''
          : `tsc exited with ${result.signal ?? result.status}`),
  };
};

/**
 * Print a failed check and fail the build the way the in-process compile
 * did: a custom server stops unless `noEmitOnError` is false; a BFF build
 * (`throwErrorInsteadOfExit`) only fails when `noEmitOnError` is true.
 */
export const reportTypeCheck = (
  check: TypeCheckResult,
  {
    appDirectory,
    tsconfigPath,
    compilerOptions,
    throwErrorInsteadOfExit,
  }: {
    appDirectory: string;
    tsconfigPath: string;
    compilerOptions: Record<string, any>;
    throwErrorInsteadOfExit?: boolean;
  },
) => {
  if (check.ok) {
    return;
  }
  logger.error(check.output);
  const { noEmitOnError } = compilerOptions;
  const tsconfigFile = path.relative(appDirectory, tsconfigPath);
  if (throwErrorInsteadOfExit) {
    // BFF builds only reported type errors before, so failing stays opt-in.
    if (noEmitOnError === true) {
      throw new Error(
        `TypeScript compilation failed ("noEmitOnError": true in ${tsconfigFile}).`,
      );
    }
    logger.error(
      `TypeScript compilation failed. Set "noEmitOnError": true in ${tsconfigFile} to fail the build on type errors.`,
    );
  } else if (noEmitOnError === undefined || noEmitOnError === true) {
    logger.error(
      `TypeScript compilation failed. To report type errors without failing the build, set "noEmitOnError": false in ${tsconfigFile}.`,
    );
    process.exit(1);
  }
};
