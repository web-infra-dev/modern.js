import { spawnSync } from 'child_process';
import path from 'path';
import {
  fs,
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
const findNearest = (configFiles: string[], key: 'include' | 'files') => {
  for (const file of [...configFiles].reverse()) {
    const raw = readTsConfigByFile(file);
    if (Array.isArray(raw?.[key])) {
      return { dir: path.dirname(file), entries: raw[key] as string[] };
    }
  }
  return undefined;
};

const isDeclarationEntry = (entry: string) => entry.endsWith('.d.ts');

export interface TypeCheckOptions {
  appDirectory: string;
  tsconfigPath: string;
  sourceDirs: string[];
  distDir: string;
  compilerOverrides?: CompilerOverrides;
  /** Emit `.d.ts` next to the compiled output. */
  declaration: boolean;
}

/**
 * Write the tsconfig the server type check runs with: it extends the server
 * tsconfig, keeps only the server directories plus the project's ambient
 * `.d.ts` files (as the in-process compile did), and turns emit off except
 * for declarations.
 */
export const writeTypeCheckConfig = (
  options: TypeCheckOptions,
  typescriptVersion: string,
) => {
  const {
    appDirectory,
    tsconfigPath,
    sourceDirs,
    distDir,
    compilerOverrides,
    declaration,
  } = options;
  const { files: configFiles } = readTsConfigWithExtends(tsconfigPath);

  const include = sourceDirs.map(dir => path.join(dir, '**/*'));
  const nearestInclude = findNearest(configFiles, 'include');
  for (const entry of nearestInclude?.entries ?? []) {
    const absolute = path.resolve(nearestInclude!.dir, entry);
    include.push(
      isDeclarationEntry(entry) ? absolute : path.join(absolute, '**/*.d.ts'),
    );
  }
  const nearestFiles = findNearest(configFiles, 'files');
  const files = (nearestFiles?.entries ?? [])
    .filter(isDeclarationEntry)
    .map(entry => path.resolve(nearestFiles!.dir, entry));

  const major = Number(typescriptVersion.split('.')[0]);
  const config = {
    extends: path.resolve(tsconfigPath),
    compilerOptions: {
      ...compilerOverrides,
      // TS5101 and the other TypeScript 6 deprecations only concern the
      // project's own config check; they must not fail the server build.
      ...(major === 6 ? { ignoreDeprecations: '6.0' } : {}),
      noEmit: !declaration,
      emitDeclarationOnly: declaration,
      declaration,
      ...(declaration
        ? { rootDir: appDirectory, outDir: distDir, declarationDir: distDir }
        : {}),
      incremental: false,
      composite: false,
    },
    include,
    files,
  };

  const configPath = path.join(
    appDirectory,
    'node_modules/.cache/modern-js/tsconfig.server-check.json',
  );
  fs.outputJSONSync(configPath, config, { spaces: 2 });
  return configPath;
};

export interface TypeCheckResult {
  ok: boolean;
  output: string;
}

/** Run the project's tsc on the server code; undefined when not installed. */
export const runTypeCheck = (
  options: TypeCheckOptions,
): TypeCheckResult | undefined => {
  const typescript = findProjectTypeScript(options.appDirectory);
  if (!typescript) {
    return undefined;
  }
  const configPath = writeTypeCheckConfig(options, typescript.version);
  const result = spawnSync(
    process.execPath,
    [typescript.tsc, '-p', configPath, '--pretty'],
    { cwd: options.appDirectory, encoding: 'utf8' },
  );
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
};
