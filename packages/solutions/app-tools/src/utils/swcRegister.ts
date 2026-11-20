import Module from 'node:module';
import path from 'node:path';
import { type Options, parseSync, transformSync } from '@swc/core';
import { fs, readTsConfigByFile } from '@modern-js/utils';

type CompilerOptions = Record<string, any>;

interface SwcRegisterOptions {
  distDir: string;
  compilerOptions?: CompilerOptions;
}

type ExtensionHandler = (module: NodeJS.Module, filename: string) => void;

const TS_EXTENSIONS = ['.ts', '.tsx', '.cts'];

const ES2022_OR_LATER = /^es(20(2[2-9]|[3-9]\d)|next)$/i;

// Only the first call installs the require hooks; later calls (e.g. a dev
// restart in the same process) just swap the options they read.
let currentOptions: SwcRegisterOptions | undefined;

const resolveExtendedConfig = (extendsPath: string, fromDir: string) => {
  const candidates = extendsPath.endsWith('.json')
    ? [extendsPath]
    : [extendsPath, `${extendsPath}.json`, `${extendsPath}/tsconfig.json`];
  for (const candidate of candidates) {
    try {
      return require.resolve(candidate, { paths: [fromDir] });
    } catch {}
  }
  return undefined;
};

/**
 * Read `compilerOptions` of a tsconfig file, following `extends` so options
 * like `experimentalDecorators` from a shared base config are respected.
 */
export const readCompilerOptions = (
  tsconfigPath: string,
  visited = new Set<string>(),
): CompilerOptions => {
  if (visited.has(tsconfigPath)) {
    return {};
  }
  visited.add(tsconfigPath);

  const config = readTsConfigByFile(tsconfigPath);
  const extendsList: string[] = config.extends
    ? ([] as string[]).concat(config.extends)
    : [];
  const baseOptions = extendsList.reduce<CompilerOptions>(
    (result, extendsPath) => {
      const resolved = resolveExtendedConfig(
        extendsPath,
        path.dirname(tsconfigPath),
      );
      return resolved
        ? { ...result, ...readCompilerOptions(resolved, visited) }
        : result;
    },
    {},
  );

  return { ...baseOptions, ...config.compilerOptions };
};

const isIgnored = (filename: string, distDir: string) => {
  if (filename.split(path.sep).includes('node_modules')) {
    return true;
  }
  const relativeToDist = path.relative(distDir, filename);
  return !relativeToDist.startsWith('..') && !path.isAbsolute(relativeToDist);
};

export const createSwcOptions = (
  filename: string,
  compilerOptions: CompilerOptions = {},
): Options => {
  const tsx = filename.endsWith('.tsx');
  const useDefineForClassFields =
    compilerOptions.useDefineForClassFields ??
    ES2022_OR_LATER.test(String(compilerOptions.target ?? ''));

  return {
    filename,
    swcrc: false,
    configFile: false,
    sourceMaps: 'inline',
    module: { type: 'commonjs' },
    jsc: {
      target: 'es2022',
      parser: {
        syntax: 'typescript',
        tsx,
        decorators: Boolean(compilerOptions.experimentalDecorators),
      },
      transform: {
        legacyDecorator: Boolean(compilerOptions.experimentalDecorators),
        decoratorMetadata: Boolean(compilerOptions.emitDecoratorMetadata),
        useDefineForClassFields,
        react: {
          runtime: compilerOptions.jsx === 'react' ? 'classic' : 'automatic',
          importSource: compilerOptions.jsxImportSource,
        },
      },
    },
  };
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

/**
 * Compile `.ts` files to CommonJS with swc through CJS require hooks.
 *
 * Used when ts-node is not installed. Unlike Node.js native type stripping,
 * the compiled modules live in `require.cache`, so the dev server can reload
 * them by deleting cache entries, and syntax that needs transforming (enum,
 * decorators, parameter properties, etc.) keeps working.
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

  for (const ext of TS_EXTENSIONS) {
    const originalHandler = extensions[ext];
    extensions[ext] = (module, filename) => {
      const { distDir, compilerOptions } = currentOptions!;
      if (isIgnored(filename, distDir)) {
        (originalHandler || extensions['.js'])(module, filename);
        return;
      }
      const source = fs.readFileSync(filename, 'utf-8');
      const rewritten = rewriteDynamicImports(source, filename);
      const { code } = transformSync(
        rewritten ?? source,
        createSwcOptions(filename, compilerOptions),
      );
      (module as any)._compile(
        rewritten ? addDynamicImportHelper(code) : code,
        filename,
      );
    };
  }
};
