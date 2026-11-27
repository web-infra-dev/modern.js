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

const findPackageJson = (file: string) => {
  for (let dir = path.dirname(file); ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'package.json');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    if (path.dirname(dir) === dir) {
      return undefined;
    }
  }
};

/**
 * The project's own TypeScript compiler, run as a command so TS 7 works too.
 * The package is the tsconfig `"ts-node": { "compiler" }` when set, as the
 * in-process compile honoured, else `typescript`; aliases such as
 * `npm:@typescript/typescript6` and forks such as ttypescript or
 * `ts-patch/compiler` resolve the same way. The command is the `tsc.js` that
 * TypeScript 5 and 6 ship next to their JS API, else the `tsc` the package
 * declares, else its only declared command (TS 7, native previews).
 */
export const findProjectTypeScript = (
  appDirectory: string,
  tsconfigPath?: string,
): TypeScriptPackage | undefined => {
  const raw = tsconfigPath ? readTsConfigByFile(tsconfigPath) : undefined;
  const compiler: string = raw?.['ts-node']?.compiler || 'typescript';
  const paths = [appDirectory];
  let pkgPath: string | undefined;
  let api: string | undefined;
  try {
    pkgPath = require.resolve(`${compiler}/package.json`, { paths });
  } catch {
    // A module inside a package, such as `ts-patch/compiler`.
    try {
      api = require.resolve(compiler, { paths });
      pkgPath = findPackageJson(api);
    } catch {
      return undefined;
    }
  }
  if (!pkgPath) {
    return undefined;
  }
  const { version, main, bin } = fs.readJSONSync(pkgPath);
  api ??= main ? path.resolve(path.dirname(pkgPath), main) : undefined;
  const sibling = api && path.join(path.dirname(api), 'tsc.js');
  if (sibling && fs.existsSync(sibling)) {
    return { tsc: sibling, version };
  }
  const commands = Object.entries<string>(
    typeof bin === 'string' ? { tsc: bin } : (bin ?? {}),
  );
  const relativeBin =
    commands.find(([name]) => name === 'tsc')?.[1] ??
    (commands.length === 1 ? commands[0][1] : undefined);
  return relativeBin
    ? { tsc: path.join(path.dirname(pkgPath), relativeBin), version }
    : undefined;
};

/**
 * The TypeScript version the command runs. A fork's package version is its
 * own (ttypescript 1.x runs the installed TypeScript), so ask the command.
 */
const compilerVersion = ({ tsc, version }: TypeScriptPackage) => {
  const result = spawnSync(process.execPath, [tsc, '--version'], {
    encoding: 'utf8',
  });
  return /Version (\d+\.\S+)/.exec(result.stdout ?? '')?.[1] ?? version ?? '';
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

/**
 * The pattern for the `.d.ts` files an `include` entry matches, following
 * TypeScript's rules: a last segment without a wildcard or an extension is a
 * directory searched recursively. A file pattern matches `x.d.ts` only when
 * it ends in `*` or `*.ts` (`*.test.ts` or `*.tsx` never do).
 */
const toDeclarationPattern = (entry: string) => {
  const slash = entry.lastIndexOf('/');
  const last = entry.slice(slash + 1);
  if (last.endsWith('.d.ts')) {
    return entry;
  }
  if (last === '**') {
    return `${entry}/*.d.ts`;
  }
  if (last.endsWith('*')) {
    return `${entry}.d.ts`;
  }
  if (last.endsWith('*.ts')) {
    return `${entry.slice(0, -'.ts'.length)}.d.ts`;
  }
  if (/[*?]/.test(last) || path.extname(last)) {
    return undefined;
  }
  return `${entry}/**/*.d.ts`;
};

/**
 * `module: CommonJS` needs a matching `moduleResolution`: `node` (`node10`),
 * the one the previous base preset used, is the only choice before
 * TypeScript 6; TypeScript 6 deprecates it and 7 removes it, while allowing
 * `bundler`.
 */
const withModuleResolution = (
  overrides: CompilerOverrides | undefined,
  major: number,
): CompilerOverrides | undefined =>
  overrides?.module?.toLowerCase() === 'commonjs' && !overrides.moduleResolution
    ? { ...overrides, moduleResolution: major >= 6 ? 'bundler' : 'node' }
    : overrides;

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
    const pattern = toDeclarationPattern(
      toPosix(path.resolve(nearestInclude!.dir, entry)),
    );
    if (pattern) {
      include.push(pattern);
    }
  }
  const nearestFiles = findNearest(configFiles, 'files');
  const files = [
    ...programFiles.map(toPosix),
    ...(nearestFiles?.entries ?? [])
      .filter(isDeclarationEntry)
      .map(entry => toPosix(path.resolve(nearestFiles!.dir, entry))),
  ];

  // `references` is not inherited through `extends`; without it tsc checks
  // referenced projects from source under this config instead of reading
  // their built declarations.
  const references = (
    (readTsConfigByFile(tsconfigPath)?.references ?? []) as {
      path: string;
    }[]
  ).map(reference => ({
    ...reference,
    path: toPosix(path.resolve(path.dirname(tsconfigPath), reference.path)),
  }));

  const major = Number(typescriptVersion.split('.')[0]);
  const config = {
    extends: toPosix(path.resolve(tsconfigPath)),
    compilerOptions: {
      ...withModuleResolution(compilerOverrides, major),
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
    ...(references.length ? { references } : {}),
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
  const typescript = findProjectTypeScript(
    options.appDirectory,
    options.tsconfigPath,
  );
  if (!typescript) {
    return undefined;
  }
  if (options.programFiles.length === 0) {
    return { ok: true, output: '', emitted: [] };
  }
  const configPath = writeTypeCheckConfig(options, compilerVersion(typescript));
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
  // A compiler that cannot run (incompatible fork, killed process) reports
  // no diagnostics; that is a broken toolchain, not type errors to report.
  if (
    result.status !== 0 &&
    // `--pretty` colours the diagnostics.
    !/error TS\d+/.test(output.replace(/\x1b\[[0-9;]*m/g, ''))
  ) {
    throw new Error(
      `${typescript.tsc} failed without reporting type errors:\n${
        [output, result.error?.message].filter(Boolean).join('\n') ||
        `exited with ${result.signal ?? result.status}`
      }`,
    );
  }
  return {
    ok: result.status === 0,
    emitted,
    output,
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
