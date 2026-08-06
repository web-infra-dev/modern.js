import * as os from 'os';
import path, { dirname, posix } from 'path';
import { findMatchedSourcePath, findSourceEntry } from '@modern-js/utils';
import type { MatchPath } from '@modern-js/utils/tsconfig-paths';
import { createMatchPath } from '@modern-js/utils/tsconfig-paths';
import * as ts from 'typescript';

// Extensions that TypeScript compiles into a `.js` file. Everything else
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

const resolveRelativeEsmSpecifier = (sf: ts.SourceFile, text: string) => {
  if (!text.startsWith('./') && !text.startsWith('../')) {
    return;
  }

  const importerDir = dirname(sf.fileName);
  return path.resolve(importerDir, text);
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

const isDynamicImport = (
  tsBinary: typeof ts,
  node: ts.Node,
): node is ts.CallExpression => {
  return (
    tsBinary.isCallExpression(node) &&
    node.expression.kind === ts.SyntaxKind.ImportKeyword
  );
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

export function tsconfigPathsBeforeHookFactory(
  tsBinary: typeof ts,
  baseUrl: string,
  paths: Record<string, string[] | string>,
  moduleType?: 'module' | 'commonjs',
) {
  const matchPath = createTsMatchPath(baseUrl, paths);

  // Native ESM output still needs relative specifiers rewritten to their
  // emitted `.js` counterparts, even when the project declares no path alias.
  if (Object.keys(paths).length === 0 && moduleType !== 'module') {
    return undefined;
  }

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    return (sf: ts.SourceFile) => {
      const visitNode = (node: ts.Node): ts.Node => {
        if (isDynamicImport(tsBinary, node)) {
          const [specifier] = node.arguments;
          // Only a literal specifier is known at compile time. Template
          // interpolation or concatenation has to be resolved at runtime, so
          // those calls are left untouched.
          if (
            !specifier ||
            !(
              tsBinary.isStringLiteral(specifier) ||
              tsBinary.isNoSubstitutionTemplateLiteral(specifier)
            )
          ) {
            return tsBinary.visitEachChild(node, visitNode, ctx);
          }
          const result = getNotAliasedPath(
            sf,
            matchPath,
            specifier.text,
            moduleType,
          );
          if (!result) {
            return node;
          }
          return tsBinary.factory.updateCallExpression(
            node,
            node.expression,
            node.typeArguments,
            tsBinary.factory.createNodeArray([
              tsBinary.factory.createStringLiteral(result),
              // `import(specifier, { with: { type: 'json' } })` carries its
              // options in the second argument, which must survive the rewrite.
              ...node.arguments.slice(1),
            ]),
          );
        }
        if (
          tsBinary.isImportDeclaration(node) ||
          (tsBinary.isExportDeclaration(node) && node.moduleSpecifier)
        ) {
          try {
            const { moduleSpecifier: specifier } = node;

            // A non-literal module specifier is a grammar error; skip it
            // instead of slicing quotes off arbitrary text.
            if (!specifier || !tsBinary.isStringLiteral(specifier)) {
              return node;
            }
            const result = getNotAliasedPath(
              sf,
              matchPath,
              specifier.text,
              moduleType,
            );
            if (!result) {
              return node;
            }
            const moduleSpecifier =
              tsBinary.factory.createStringLiteral(result);
            (moduleSpecifier as any).parent = (
              node as any
            ).moduleSpecifier.parent;

            // `with { type: 'json' }` is parsed into `attributes`; the legacy
            // `assert { ... }` syntax into `assertClause`. Keep whichever the
            // source used, otherwise the clause is dropped on rewrite.
            const importAttributes = node.attributes ?? node.assertClause;

            let newNode;
            if (tsBinary.isImportDeclaration(node)) {
              newNode = tsBinary.factory.updateImportDeclaration(
                node,
                node.modifiers,
                node.importClause,
                moduleSpecifier,
                importAttributes,
              );
            } else {
              newNode = tsBinary.factory.updateExportDeclaration(
                node,
                node.modifiers,
                node.isTypeOnly,
                node.exportClause,
                moduleSpecifier,
                importAttributes,
              );
            }
            (newNode as any).flags = node.flags;
            return newNode;
          } catch {
            return node;
          }
        }
        return tsBinary.visitEachChild(node, visitNode, ctx);
      };
      return tsBinary.visitNode(sf, visitNode);
    };
  };
}

// TypeScript never resolves tsconfig `paths` in declaration output
// (microsoft/TypeScript#30952), so the alias rewrite that runs on JS emit must
// run again on the declaration AST. Differences from the `before` transform:
// declaration nodes are synthesized without source positions (specifiers are
// read via `.text`), inline `import("...")` types appear as `ImportTypeNode`,
// and `import x = require("...")` keeps its specifier in an
// `ExternalModuleReference`. `moduleType` is intentionally not forwarded:
// declaration specifiers stay extensionless.
export function tsconfigPathsAfterDeclarationsHookFactory(
  tsBinary: typeof ts,
  baseUrl: string,
  paths: Record<string, string[] | string>,
) {
  // Declarations only need rewriting when the project declares path aliases;
  // there is no ESM `.js`-extension concern here, unlike the `before` hook.
  if (Object.keys(paths).length === 0) {
    return undefined;
  }

  const matchPath = createTsMatchPath(baseUrl, paths);
  const rewrite = (sf: ts.SourceFile, text: string) =>
    getNotAliasedPath(sf, matchPath, text);

  return (
    ctx: ts.TransformationContext,
  ): ts.Transformer<ts.SourceFile | ts.Bundle> => {
    const { factory } = ctx;
    return sourceFile => {
      if (!tsBinary.isSourceFile(sourceFile)) {
        return sourceFile;
      }
      const visitNode = (node: ts.Node): ts.Node => {
        if (tsBinary.isImportTypeNode(node)) {
          const { argument } = node;
          if (
            tsBinary.isLiteralTypeNode(argument) &&
            tsBinary.isStringLiteral(argument.literal)
          ) {
            const result = rewrite(sourceFile, argument.literal.text);
            if (result) {
              const updated = factory.updateImportTypeNode(
                node,
                factory.createLiteralTypeNode(
                  factory.createStringLiteral(result),
                ),
                // TS >= 5.3 names this `attributes`; earlier 5.x `assertions`.
                (node as any).attributes ?? (node as any).assertions,
                node.qualifier,
                node.typeArguments,
                node.isTypeOf,
              );
              return tsBinary.visitEachChild(updated, visitNode, ctx);
            }
          }
          return tsBinary.visitEachChild(node, visitNode, ctx);
        }

        if (
          (tsBinary.isImportDeclaration(node) ||
            tsBinary.isExportDeclaration(node)) &&
          node.moduleSpecifier &&
          tsBinary.isStringLiteral(node.moduleSpecifier)
        ) {
          const result = rewrite(sourceFile, node.moduleSpecifier.text);
          if (!result) {
            return node;
          }
          const moduleSpecifier = factory.createStringLiteral(result);
          const importAttributes =
            (node as any).attributes ?? node.assertClause;
          if (tsBinary.isImportDeclaration(node)) {
            return factory.updateImportDeclaration(
              node,
              node.modifiers,
              node.importClause,
              moduleSpecifier,
              importAttributes,
            );
          }
          return factory.updateExportDeclaration(
            node,
            node.modifiers,
            node.isTypeOnly,
            node.exportClause,
            moduleSpecifier,
            importAttributes,
          );
        }

        if (
          tsBinary.isImportEqualsDeclaration(node) &&
          tsBinary.isExternalModuleReference(node.moduleReference) &&
          tsBinary.isStringLiteral(node.moduleReference.expression)
        ) {
          const result = rewrite(
            sourceFile,
            node.moduleReference.expression.text,
          );
          if (!result) {
            return node;
          }
          return factory.updateImportEqualsDeclaration(
            node,
            node.modifiers,
            node.isTypeOnly,
            node.name,
            factory.createExternalModuleReference(
              factory.createStringLiteral(result),
            ),
          );
        }

        return tsBinary.visitEachChild(node, visitNode, ctx);
      };
      return tsBinary.visitEachChild(sourceFile, visitNode, ctx);
    };
  };
}

function getNotAliasedPath(
  sf: ts.SourceFile,
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
    result = resolveRelativeEsmSpecifier(sf, text);
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
  const resolvedPath = posix.relative(dirname(sf.fileName), result) || './';
  return resolvedPath[0] === '.' ? resolvedPath : `./${resolvedPath}`;
}
