import * as os from 'os';
import path, { dirname, posix } from 'path';
import { findMatchedSourcePath, findSourceEntry } from '@modern-js/utils';
import type { MatchPath } from '@modern-js/utils/tsconfig-paths';
import { createMatchPath } from '@modern-js/utils/tsconfig-paths';
import { parseSync } from '@swc/core';

// Extensions that the server compile turns into a `.js` file. Everything else
// (`.json`, `.mjs`, `.cjs`, assets) keeps whatever extension it already has,
// because it is copied to the output directory untouched.
const COMPILED_TO_JS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

// Convert a resolved source path into the specifier that native ESM output
// should reference at runtime.
const toEsmOutputPath = (resolvedPath: string) => {
  // A directory match is joined with the platform separator, so on Windows the
  // result comes back with backslashes. Emitted specifiers are always posix.
  const sourcePath = (findSourceEntry(resolvedPath) || resolvedPath).replace(
    /\\/g,
    '/',
  );
  const ext = path.extname(sourcePath);

  if (!ext) {
    return `${sourcePath}.js`;
  }

  if (!COMPILED_TO_JS_EXTENSIONS.has(ext)) {
    return sourcePath;
  }

  return `${sourcePath.slice(0, -ext.length)}.js`;
};

const resolveRelativeEsmSpecifier = (importer: string, text: string) => {
  if (!text.startsWith('./') && !text.startsWith('../')) {
    return;
  }

  return path.resolve(dirname(importer), text);
};

const isRegExpKey = (str: string) => {
  return str.startsWith('^') || str.endsWith('$');
};

const resolveAliasPath = (baseUrl: string, filePath: string) => {
  // exclude absolute path and alias
  if (filePath.startsWith('.') || filePath.startsWith('..')) {
    return path.resolve(baseUrl, filePath);
  }
  return filePath;
};

const createAliasMatcher = (baseUrl: string, alias: Record<string, string>) => {
  const aliasPairs = Object.keys(alias).reduce(
    (o, key) => {
      if (isRegExpKey(key)) {
        const regexp = new RegExp(key);
        const aliasPath = resolveAliasPath(baseUrl, alias[key]);
        o.push([regexp, aliasPath]);
      } else {
        const aliasPath = resolveAliasPath(baseUrl, alias[key]);
        o.push([key, aliasPath]);
      }
      return o;
    },
    [] as [string | RegExp, string][],
  );

  const cacheMap = new Map<string, string>();

  return (requestedModule: string) => {
    if (cacheMap.has(requestedModule)) {
      return cacheMap.get(requestedModule);
    }
    for (const [key, value] of aliasPairs) {
      if (key instanceof RegExp) {
        if (key.test(requestedModule)) {
          cacheMap.set(requestedModule, value);
          return value;
        }
      }
      if (requestedModule === key) {
        cacheMap.set(requestedModule, value);
        return value;
      }
    }
  };
};

const createTsMatchPath = (
  baseUrl: string,
  paths: Record<string, string[] | string>,
): MatchPath => {
  const tsPaths: Record<string, string[]> = {};
  const alias: Record<string, string> = {};

  Object.keys(paths).forEach(key => {
    if (Array.isArray(paths[key])) {
      tsPaths[key] = paths[key] as string[];
    } else {
      alias[key] = paths[key] as string;
    }
  });

  const matchAliasPath = createAliasMatcher(baseUrl, alias);

  const matchTsPath = createMatchPath(baseUrl, tsPaths, ['main']);

  return (requestedModule, readJSONSync, fileExists, extensions) => {
    const result = matchTsPath(
      requestedModule,
      readJSONSync,
      fileExists,
      extensions,
    );
    if (result) {
      return result;
    }
    return matchAliasPath(requestedModule);
  };
};

export type SpecifierRewriter = (
  importer: string,
  text: string,
) => string | undefined;

/**
 * Rewrite tsconfig `paths` / `source.alias` specifiers to relative paths, and
 * relative specifiers of native ESM output to their emitted `.js` file.
 * Returns undefined when nothing needs rewriting.
 */
export const createSpecifierRewriter = (
  baseUrl: string,
  paths: Record<string, string[] | string>,
  moduleType?: 'module' | 'commonjs',
): SpecifierRewriter | undefined => {
  if (Object.keys(paths).length === 0 && moduleType !== 'module') {
    return undefined;
  }
  const matchPath = createTsMatchPath(baseUrl, paths);
  return (importer, text) =>
    getNotAliasedPath(importer, matchPath, text, moduleType);
};

type Node = Record<string, any>;
interface StringLiteral {
  type: 'StringLiteral';
  value: string;
  span: { start: number; end: number };
}

const isStringLiteral = (node: unknown): node is StringLiteral =>
  Boolean(node) && (node as Node).type === 'StringLiteral';

// Module specifiers the compile rewrites: import / export declarations,
// `import('...')` with a literal argument, `import x = require('...')` and,
// in declaration files, inline `import('...')` types. `require()` calls are
// left alone, as before.
const collectSpecifiers = (node: unknown, found: StringLiteral[]) => {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      collectSpecifiers(child, found);
    }
    return;
  }
  const current = node as Node;
  switch (current.type) {
    case 'ImportDeclaration':
    case 'ExportAllDeclaration':
    case 'ExportNamedDeclaration':
      if (isStringLiteral(current.source)) {
        found.push(current.source);
      }
      break;
    case 'CallExpression':
      if (
        current.callee?.type === 'Import' &&
        isStringLiteral(current.arguments?.[0]?.expression)
      ) {
        found.push(current.arguments[0].expression);
      }
      break;
    case 'TsExternalModuleReference':
      if (isStringLiteral(current.expression)) {
        found.push(current.expression);
      }
      break;
    case 'TsImportType':
      if (isStringLiteral(current.argument)) {
        found.push(current.argument);
      }
      break;
    default:
      break;
  }
  for (const key of Object.keys(current)) {
    if (key !== 'span') {
      collectSpecifiers(current[key], found);
    }
  }
};

// swc reports spans as byte offsets into a source map shared by every parse,
// so a leading `0;` pins the start of this file to a known position.
const SPAN_ANCHOR = '0;';

/**
 * Apply `rewrite` to every module specifier of `source` and return the new
 * source text. Only the string literals change; everything else, including
 * import attributes and comments, is kept byte for byte.
 */
export const rewriteSpecifiers = (
  source: string,
  filename: string,
  rewrite: SpecifierRewriter,
  { typescript, tsx = false }: { typescript: boolean; tsx?: boolean },
): string => {
  const shebang = source.startsWith('#!')
    ? source.slice(0, source.indexOf('\n') + 1 || source.length)
    : '';
  const body = Buffer.from(SPAN_ANCHOR + source.slice(shebang.length));
  const ast = parseSync(body.toString(), {
    syntax: typescript ? 'typescript' : 'ecmascript',
    ...(typescript
      ? { tsx, decorators: true }
      : { jsx: true, decorators: true }),
    target: 'esnext',
    comments: false,
  } as Parameters<typeof parseSync>[1]);
  const base = ast.span.start;

  const literals: StringLiteral[] = [];
  collectSpecifiers(ast.body, literals);

  const edits = literals
    .map(literal => ({
      start: literal.span.start - base,
      end: literal.span.end - base,
      value: rewrite(filename, literal.value),
    }))
    .filter((edit): edit is { start: number; end: number; value: string } =>
      Boolean(edit.value),
    )
    .sort((a, b) => b.start - a.start);

  if (edits.length === 0) {
    return source;
  }

  let result = body;
  for (const { start, end, value } of edits) {
    result = Buffer.concat([
      result.subarray(0, start),
      Buffer.from(JSON.stringify(value)),
      result.subarray(end),
    ]);
  }
  return shebang + result.subarray(SPAN_ANCHOR.length).toString();
};

function getNotAliasedPath(
  importer: string,
  matcher: MatchPath,
  text: string,
  moduleType?: 'module' | 'commonjs',
) {
  // Resolve aliases and tsconfig paths using the same `.js` -> `.ts` fallback
  // rules as the runtime loaders.
  let result = findMatchedSourcePath(matcher, text);

  // For native ESM, unresolved relative imports like `../service/user` must be
  // resolved to a source path before we convert them to the emitted `.js` specifier.
  if (!result && moduleType === 'module') {
    // This branch is only for relative specifiers. Bare package imports should
    // stay untouched when they are not matched by alias rules.
    result = resolveRelativeEsmSpecifier(importer, text);
  }

  if (!result) {
    return;
  }

  if (os.platform() === 'win32') {
    result = result.replace(/\\/g, '/');
  }

  if (!path.isAbsolute(result)) {
    // If an alias resolves to another bare specifier, prefer leaving it as a
    // package import when Node can resolve that package.
    if (!result.startsWith('.') && !result.startsWith('..')) {
      try {
        // Installed packages (node modules) should take precedence over root files with the same name.
        // Ref: https://github.com/nestjs/nest-cli/issues/838
        const packagePath = require.resolve(result, {
          paths: [process.cwd(), ...module.paths],
        });
        if (packagePath) {
          return result;
        }
      } catch {}
    }
    try {
      // Likewise, if the original specifier already resolves as a package,
      // keep the original text instead of forcing a relative filesystem path.
      // Installed packages (node modules) should take precedence over root files with the same name.
      // Ref: https://github.com/nestjs/nest-cli/issues/838
      const packagePath = require.resolve(text, {
        paths: [process.cwd(), ...module.paths],
      });
      if (packagePath) {
        return text;
      }
    } catch {}
  }

  if (moduleType === 'module') {
    // Native ESM output must reference the emitted file extension that Node
    // will load at runtime, typically `.js`.
    result = toEsmOutputPath(result);
  }

  // Emit a relative specifier from the current source file to the resolved target.
  const resolvedPath = posix.relative(dirname(importer), result) || './';
  return resolvedPath[0] === '.' ? resolvedPath : `./${resolvedPath}`;
}
