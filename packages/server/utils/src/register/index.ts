import Module from 'node:module';
import path from 'node:path';
import { fs, getAliasConfig, readTsConfigWithExtends } from '@modern-js/utils';
import { register as registerPaths } from '@modern-js/utils/tsconfig-paths';
import { parseSync, transformSync } from '@swc/core';
import { createSwcOptions } from '../compilers/swc';

type CompilerOptions = Record<string, any>;

interface SwcRegisterOptions {
  distDir: string;
  compilerOptions?: CompilerOptions;
  /**
   * `package.json#type` of the app. In a `module` app, `require()` of a
   * `.ts` file fails with `ERR_REQUIRE_ESM`, as it does with ts-node and
   * Node itself, so scanners that try `require()` first fall back to
   * `import()` and load the one ES module instance.
   */
  moduleType?: 'module' | 'commonjs';
}

type ExtensionHandler = (module: NodeJS.Module, filename: string) => void;

const TS_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];

// Only the first call installs the require hooks; later calls (e.g. a dev
// restart in the same process) just swap the options they read.
let currentOptions: SwcRegisterOptions | undefined;

/**
 * `compilerOptions` of a tsconfig file with its `extends` chain applied, so
 * options like `experimentalDecorators` from a shared base are respected.
 */
export const readCompilerOptions = (tsconfigPath: string): CompilerOptions =>
  readTsConfigWithExtends(tsconfigPath).compilerOptions;

// NodeNext-style sources import `./user.js` for `./user.ts`; like ts-node,
// fall back to the TypeScript file when the JavaScript one does not exist.
const TS_FOR_JS: Record<string, string[]> = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};

const getTypeScriptCandidates = (request: string): string[] => {
  if (!request.startsWith('./') && !request.startsWith('../')) {
    return [];
  }
  const ext = path.extname(request);
  return (TS_FOR_JS[ext] ?? []).map(
    tsExt => request.slice(0, -ext.length) + tsExt,
  );
};

const DYNAMIC_IMPORT_HELPER = '__modern_dynamic_import__';

const MAY_HAVE_DYNAMIC_IMPORT = /\bimport\s*\(/;

// Codes `require()` throws when the target can only be loaded as an ES module:
// an ESM module with top-level await, or a package whose `exports` has no
// `require` condition.
const ESM_ONLY_ERROR_CODES = [
  'ERR_REQUIRE_ESM',
  'ERR_REQUIRE_ASYNC_MODULE',
  'ERR_PACKAGE_PATH_NOT_EXPORTED',
];

// Added to the compiled output after swc has run, so the `import()` in it
// stays native and resolves relative to the user's module.
const DYNAMIC_IMPORT_HELPER_CODE = `const ${DYNAMIC_IMPORT_HELPER} = viaRequire => specifier => viaRequire(specifier).catch(error => { if (error && ${JSON.stringify(ESM_ONLY_ERROR_CODES)}.includes(error.code)) return import(specifier); throw error; });`;

const collectDynamicImports = (node: any, result: number[]) => {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectDynamicImports(child, result);
    }
    return;
  }
  if (!node || typeof node !== 'object') {
    return;
  }
  // `import(x, { with: ... })` passes import attributes that `require()` can't
  // honor, so only single-argument calls are rewritten.
  if (
    node.type === 'CallExpression' &&
    node.callee?.type === 'Import' &&
    node.arguments.length === 1
  ) {
    result.push(node.callee.span.start);
  }
  for (const key of Object.keys(node)) {
    if (key !== 'span') {
      collectDynamicImports(node[key], result);
    }
  }
};

/**
 * Rewrite each `import(x)` to `__modern_dynamic_import__(s => import(s))(x)`.
 *
 * swc still lowers the inner `import(s)` to `require()`, so extensionless and
 * tsconfig alias specifiers, swc transforms and `require.cache` keep working.
 * The helper retries with a native `import()` only when `require()` fails
 * because the target is ESM-only.
 */
const rewriteDynamicImports = (source: string, filename: string) => {
  if (!MAY_HAVE_DYNAMIC_IMPORT.test(source)) {
    return undefined;
  }
  let ast: any;
  try {
    ast = parseSync(source, {
      syntax: 'typescript',
      tsx: filename.endsWith('.tsx'),
      decorators: true,
    });
  } catch {
    // Let `transformSync` report the syntax error.
    return undefined;
  }
  const starts: number[] = [];
  collectDynamicImports(ast, starts);
  if (!starts.length) {
    return undefined;
  }

  // Spans are byte offsets starting at 1, not at the module span: that points
  // at the first statement and skips leading comments.
  const buffer = Buffer.from(source);
  const chunks: Buffer[] = [];
  let last = 0;
  for (const start of starts.sort((a, b) => a - b)) {
    const offset = start - 1;
    if (buffer.toString('utf-8', offset, offset + 6) !== 'import') {
      return undefined;
    }
    chunks.push(
      buffer.subarray(last, offset),
      Buffer.from(`${DYNAMIC_IMPORT_HELPER}(s => import(s))`),
    );
    last = offset + 6;
  }
  chunks.push(buffer.subarray(last));
  return Buffer.concat(chunks).toString('utf-8');
};

/**
 * Add the helper used by rewritten dynamic imports. It goes on the first line
 * without a newline so line numbers in the inline source map stay correct, and
 * after `"use strict"` so the directive still applies.
 */
const addDynamicImportHelper = (code: string) => {
  const directive = /^(["'])use strict\1;/.exec(code);
  const index = directive ? directive[0].length : 0;
  return `${code.slice(0, index)}${DYNAMIC_IMPORT_HELPER_CODE}${code.slice(index)}`;
};

const isIgnored = (filename: string, distDir: string) => {
  if (filename.split(path.sep).includes('node_modules')) {
    return true;
  }
  const relativeToDist = path.relative(distDir, filename);
  return !relativeToDist.startsWith('..') && !path.isAbsolute(relativeToDist);
};

/**
 * Compile `.ts` files to CommonJS with swc through CJS require hooks.
 *
 * Unlike Node.js native type stripping, the compiled modules live in
 * `require.cache`, so the dev server can reload them by deleting cache
 * entries, and syntax that needs transforming (enum, decorators, parameter
 * properties, etc.) keeps working.
 */
export const registerSwc = (options: SwcRegisterOptions) => {
  const shouldInstall = !currentOptions;
  currentOptions = options;
  if (!shouldInstall) {
    return;
  }

  // The compiled code moves lines around (e.g. rewritten imports), so map
  // error stack traces back to the source through the inline source maps.
  process.setSourceMapsEnabled(true);

  const extensions = (Module as any)._extensions as Record<
    string,
    ExtensionHandler
  >;

  const moduleWithResolve = Module as unknown as {
    _resolveFilename: (
      request: string,
      parent?: NodeJS.Module,
      ...rest: unknown[]
    ) => string;
  };
  const originalResolveFilename = moduleWithResolve._resolveFilename;
  moduleWithResolve._resolveFilename = function (request, parent, ...rest) {
    try {
      return originalResolveFilename.call(this, request, parent, ...rest);
    } catch (error) {
      const candidates = getTypeScriptCandidates(request);
      if (
        (error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND' ||
        candidates.length === 0 ||
        !parent?.filename ||
        isIgnored(parent.filename, currentOptions!.distDir)
      ) {
        throw error;
      }
      for (const candidate of candidates) {
        try {
          return originalResolveFilename.call(this, candidate, parent, ...rest);
        } catch {}
      }
      throw error;
    }
  };

  for (const ext of TS_EXTENSIONS) {
    const originalHandler = extensions[ext];
    extensions[ext] = (module, filename) => {
      const { distDir, compilerOptions = {}, moduleType } = currentOptions!;
      if (isIgnored(filename, distDir)) {
        (originalHandler || extensions['.js'])(module, filename);
        return;
      }
      // A `.mts` file is an ES module in any project, like `.mjs`.
      if ((moduleType === 'module' && ext !== '.cts') || ext === '.mts') {
        const error: NodeJS.ErrnoException = new Error(
          `require() of ES Module ${filename} not supported.`,
        );
        error.code = 'ERR_REQUIRE_ESM';
        throw error;
      }
      const source = fs.readFileSync(filename, 'utf-8');
      const rewritten = rewriteDynamicImports(source, filename);
      const { code } = transformSync(rewritten ?? source, {
        ...createSwcOptions(filename, compilerOptions, 'commonjs'),
        sourceMaps: 'inline',
      });
      (module as any)._compile(
        rewritten ? addDynamicImportHelper(code) : code,
        filename,
      );
    };
  }
};

export interface ServerRuntimeOptions {
  appDirectory: string;
  distDirectory: string;
  /** The server tsconfig, as resolved by `resolveServerTsconfigInfo`. */
  tsconfigPath: string;
}

/**
 * Run the server code of an app from source in the current process: tsconfig
 * `paths` aliases, swc require hooks, and the `require` preloads of the
 * tsconfig `"ts-node"` section, which keeps working without ts-node.
 */
export const registerServerRuntime = ({
  appDirectory,
  distDirectory,
  tsconfigPath,
}: ServerRuntimeOptions) => {
  const { raw, compilerOptions } = readTsConfigWithExtends(tsconfigPath);
  const tsNodeOptions = raw['ts-node'] ?? {};

  const { paths = {}, absoluteBaseUrl = './' } = getAliasConfig(
    {},
    {
      appDirectory,
      tsconfigPath,
    },
  );
  // `source.alias` entries are not part of this config, so every value is
  // the array form tsconfig `paths` uses.
  const tsconfigPaths: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(paths)) {
    tsconfigPaths[key] = ([] as string[]).concat(value);
  }
  if (Object.keys(tsconfigPaths).length > 0) {
    registerPaths({ baseUrl: absoluteBaseUrl, paths: tsconfigPaths });
  }

  registerSwc({
    distDir: distDirectory,
    compilerOptions: { ...compilerOptions, ...tsNodeOptions.compilerOptions },
  });

  const appRequire = Module.createRequire(
    path.join(appDirectory, 'package.json'),
  );
  const preloads: string[] = [].concat(tsNodeOptions.require ?? []);
  for (const request of preloads) {
    appRequire(request);
  }
};
