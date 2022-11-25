import * as os from 'os';
import path, { dirname, posix } from 'path';
import * as ts from 'typescript';
import { createMatchPath, MatchPath } from '@modern-js/utils/tsconfig-paths';

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
  const aliasPairs = Object.keys(alias).reduce((o, key) => {
    if (isRegExpKey(key)) {
      const regexp = new RegExp(key);
      const aliasPath = resolveAliasPath(baseUrl, alias[key]);
      o.push([regexp, aliasPath]);
    } else {
      const aliasPath = resolveAliasPath(baseUrl, alias[key]);
      o.push([key, aliasPath]);
    }
    return o;
  }, [] as [string | RegExp, string][]);

  const cacheMap = new Map<string, string>();

  // eslint-disable-next-line consistent-return
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

export function tsconfigPathsBeforeHookFactory(
  tsBinary: typeof ts,
  baseUrl: string,
  paths: Record<string, string[] | string>,
) {
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

  const matchPath: MatchPath = (
    requestedModule,
    readJSONSync,
    fileExists,
    extensions,
  ) => {
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

  if (Object.keys(paths).length === 0) {
    return undefined;
  }

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    return (sf: ts.SourceFile) => {
      const visitNode = (node: ts.Node): ts.Node => {
        if (isDynamicImport(tsBinary, node)) {
          const importPathWithQuotes = node.arguments[0].getText(sf);
          const text = importPathWithQuotes.slice(
            1,
            importPathWithQuotes.length - 1,
          );
          const result = getNotAliasedPath(sf, matchPath, text);
          if (!result) {
            return node;
          }
          return tsBinary.factory.updateCallExpression(
            node,
            node.expression,
            node.typeArguments,
            tsBinary.factory.createNodeArray([
              tsBinary.factory.createStringLiteral(result),
            ]),
          );
        }
        if (
          tsBinary.isImportDeclaration(node) ||
          (tsBinary.isExportDeclaration(node) && node.moduleSpecifier)
        ) {
          try {
            const importPathWithQuotes = node?.moduleSpecifier?.getText();

            if (!importPathWithQuotes) {
              return node;
            }
            const text = importPathWithQuotes.substring(
              1,
              importPathWithQuotes.length - 1,
            );
            const result = getNotAliasedPath(sf, matchPath, text);
            if (!result) {
              return node;
            }
            const moduleSpecifier =
              tsBinary.factory.createStringLiteral(result);
            (moduleSpecifier as any).parent = (
              node as any
            ).moduleSpecifier.parent;

            let newNode;
            if (tsBinary.isImportDeclaration(node)) {
              newNode = tsBinary.factory.updateImportDeclaration(
                node,
                node.decorators,
                node.modifiers,
                node.importClause,
                moduleSpecifier,
                node.assertClause,
              );
            } else {
              newNode = tsBinary.factory.updateExportDeclaration(
                node,
                node.decorators,
                node.modifiers,
                node.isTypeOnly,
                node.exportClause,
                moduleSpecifier,
                node.assertClause,
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

// fork from https://github.com/nestjs/nest-cli/blob/HEAD/lib/compiler/hooks/tsconfig-paths.hook.ts
function getNotAliasedPath(
  sf: ts.SourceFile,
  matcher: MatchPath,
  text: string,
) {
  let result = matcher(text, undefined, undefined, [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
  ]);

  if (!result) {
    return;
  }

  if (os.platform() === 'win32') {
    result = result.replace(/\\/g, '/');
  }

  if (!path.isAbsolute(result)) {
    // handle alias to alias
    if (!result.startsWith('.') && !result.startsWith('..')) {
      try {
        // Installed packages (node modules) should take precedence over root files with the same name.
        // Ref: https://github.com/nestjs/nest-cli/issues/838
        const packagePath = require.resolve(result, {
          paths: [process.cwd(), ...module.paths],
        });
        if (packagePath) {
          // eslint-disable-next-line consistent-return
          return result;
        }
      } catch {}
    }
    try {
      // Installed packages (node modules) should take precedence over root files with the same name.
      // Ref: https://github.com/nestjs/nest-cli/issues/838
      const packagePath = require.resolve(text, {
        paths: [process.cwd(), ...module.paths],
      });
      if (packagePath) {
        // eslint-disable-next-line consistent-return
        return text;
      }
    } catch {}
  }

  const resolvedPath = posix.relative(dirname(sf.fileName), result) || './';
  // eslint-disable-next-line consistent-return
  return resolvedPath[0] === '.' ? resolvedPath : `./${resolvedPath}`;
}
