/* eslint-disable no-inner-declarations */

import nodePath from 'path';
import { fs } from '@modern-js/utils';
import * as babel from '@babel/core';
import type { NodePath } from '@babel/core';
import type { Binding, Visitor } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

/**
 * 1. invalid @@abc, 2abc, a-b-c
 * 2. __esModule as reverse word
 */
const ignoreExportVariableNames = ['__esModule'];
export function validateExportVariableName(n: string) {
  return (
    /^[$_a-zA-Z][$_\w]*$/.test(n) && !ignoreExportVariableNames.includes(n)
  );
}

const cache = new Map<string, string[]>();

/**
 * parse export variable names from commonjs or umd spec
 * @param fileLoc the absolute path for a code file
 */
export const parseExportVariableNamesFromCJSorUMDFile = async (
  fileLoc: string,
) => {
  if (!nodePath.isAbsolute(fileLoc)) {
    throw new Error('fileLoc should be a absolute path');
  }
  const cached = cache.get(fileLoc);
  if (Array.isArray(cached)) {
    return cached;
  }
  const resultSet = new Set<string>();
  const pendingSet = new Set<string>();
  const visitedSet = new Set<string>();
  pendingSet.add(fileLoc);
  while (pendingSet.size) {
    for (const pendingFileLoc of pendingSet) {
      await doParse(
        {
          pendingSet,
          visitedSet,
          resultSet,
        },
        pendingFileLoc,
      );
    }
  }
  const ret = Array.from(resultSet).filter(k => validateExportVariableName(k));
  cache.set(fileLoc, ret);
  return ret;
};

type ParseContext = {
  pendingSet: Set<string>;
  visitedSet: Set<string>;
  resultSet: Set<string>;
};

async function doParse(ctx: ParseContext, fileLoc: string) {
  //   console.log('doParse', fileLoc);
  const { pendingSet, visitedSet, resultSet } = ctx;
  let ast: babel.types.File | babel.types.Program | null = null;
  try {
    const code = (await fs.readFile(fileLoc)).toString();
    ast = await babel.parseAsync(code);
  } catch (e) {
    defer();
    throw e;
  }
  if (!ast) {
    defer();
    throw new Error('parseExportVariableNames failed');
  }
  traverse(
    ast,
    visitorCreator({
      testUMD: true,
    }),
  );

  type VisitorCreatorParams = {
    testUMD: boolean;
    exportsAliasName?: string;
  };
  function visitorCreator({
    testUMD,
    exportsAliasName,
  }: VisitorCreatorParams): Visitor {
    return {
      AssignmentExpression: path => {
        const { left } = path.node;
        if (t.isMemberExpression(left)) {
          const { object } = left;
          const { property } = left;
          let isModuleExports = false;
          let isExports = false;
          // module.exports.foo
          if (t.isMemberExpression(object)) {
            const oo = object.object;
            const op = object.property;
            if (
              t.isIdentifier(oo) &&
              oo.name === 'module' &&
              t.isIdentifier(op) &&
              op.name === 'exports'
            ) {
              isModuleExports = true;
            }
          }

          // exports.foo
          if (t.isIdentifier(object)) {
            if (object.name === 'exports') {
              isExports = true;
            }

            // UMD wrapper 包裹了以后 exports 就需要判断别名
            if (exportsAliasName && object.name === exportsAliasName) {
              isExports = true;
            }
          }

          if (isModuleExports || isExports) {
            if (t.isIdentifier(property)) {
              // foo
              resultSet.add(property.name);
            }
          }
        }
      },
      CallExpression: path => {
        const { callee } = path.node;
        const args = path.node.arguments;
        /**
         * __exportStar(require("./foo"), exports)
         */
        if (t.isIdentifier(callee) && callee.name === '__exportStar') {
          if (t.isIdentifier(args[1]) && args[1].name === 'exports') {
            if (t.isCallExpression(args[0])) {
              const callee2 = args[0].callee;
              const args2 = args[0].arguments;
              if (t.isIdentifier(callee2) && callee2.name === 'require') {
                if (t.isStringLiteral(args2[0])) {
                  const reexportPath = args2[0].value;
                  if (nodePath.isAbsolute(reexportPath)) {
                    if (!visitedSet.has(reexportPath)) {
                      pendingSet.add(reexportPath);
                    }
                  } else {
                    const targetPath = require.resolve(reexportPath, {
                      paths: [nodePath.dirname(fileLoc)],
                    });

                    if (!visitedSet.has(reexportPath)) {
                      pendingSet.add(targetPath);
                    }
                  }
                }
              }
            }
          }
        }

        if (testUMD) {
          // UMD
          if (t.isFunctionExpression(callee)) {
            const expStat = callee.body.body[0];
            let isUMD = false;
            let aliasName = '';
            if (
              expStat &&
              t.isExpressionStatement(expStat) &&
              t.isConditionalExpression(expStat.expression)
            ) {
              const { test } = expStat.expression;
              let hasTestExports = false;
              let hasTestModule = false;
              // 'object' === typeof exports && 'undefined' !== typeof module
              if (t.isLogicalExpression(test)) {
                const { left, right } = test;
                // TODO: error TS2345: Argument of type 'import("/node_modules/.pnpm/@babel+types@7.12.17/node_modules/@babel/types/lib/index").Expression' is not assignable to parameter of type 'babel.types.Expression'.
                testAndAnd(left as any);
                testAndAnd(right as any);
                function testAndAnd(exp: babel.types.Expression) {
                  if (t.isBinaryExpression(exp)) {
                    if (exp.operator === '==' || exp.operator === '===') {
                      const left2 = exp.left;
                      const right2 = exp.right;
                      testTypeofExports(left2);
                      testTypeofExports(right2);
                      function testTypeofExports(
                        n: babel.types.Expression | babel.types.PrivateName,
                      ) {
                        if (
                          t.isUnaryExpression(n) &&
                          n.operator === 'typeof' &&
                          t.isIdentifier(n.argument)
                        ) {
                          if (n.argument.name === 'exports') {
                            hasTestExports = true;
                          }
                        }
                      }
                    }
                    if (exp.operator === '!=' || exp.operator === '!==') {
                      const left2 = exp.left;
                      const right2 = exp.right;
                      testTypeofModule(left2);
                      testTypeofModule(right2);
                      function testTypeofModule(
                        n: babel.types.Expression | babel.types.PrivateName,
                      ) {
                        if (
                          t.isUnaryExpression(n) &&
                          n.operator === 'typeof' &&
                          t.isIdentifier(n.argument)
                        ) {
                          if (n.argument.name === 'module') {
                            hasTestModule = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
              if (hasTestExports && hasTestModule) {
                const thisMaybe = args[0];
                if (t.isThisExpression(thisMaybe)) {
                  // 获取 exports 的别名
                  const factoryFuncExp = args[1];
                  if (t.isFunctionExpression(factoryFuncExp)) {
                    const firstParam = factoryFuncExp.params[0];
                    if (t.isIdentifier(firstParam)) {
                      aliasName = firstParam.name;
                      /**
                       * 含有 xxx === typeof exports && xxx === typeof module,
                       * (可以 == 或者 ===, && 顺序可呼唤, === 顺序可互换)
                       * 且第一个参数是 this, 第二个是 factory 函数
                       * 以上都符合, 则认为是 UMD 的 wrapper 函数
                       */
                      isUMD = true;
                    }
                  }
                }
              }
            }

            if (isUMD) {
              const umdFuncExp = args[1];
              if (t.isFunctionExpression(umdFuncExp)) {
                type BlockStatementNodePath = NodePath<
                  Extract<t.BlockStatement, { type: any }>
                >;
                const bodyPath = path.get(
                  'arguments.1.body',
                ) as BlockStatementNodePath;
                if (bodyPath) {
                  bodyPath.traverse(
                    visitorCreator({
                      testUMD: false,
                      exportsAliasName: aliasName,
                    }),
                  );
                }
              }
            }
          }
        }
      },
    };
  }

  defer();
  function defer() {
    visitedSet.add(fileLoc);
    pendingSet.delete(fileLoc);
  }
}

export const ignoreKeys = [
  '__proto__',
  'constructor',
  'prototype',
  'default',
  'import',
  'export',
  'delete',
  'function',
];

/**
 * parse export information from ESM spec code
 * @param code code string
 */
export const parseExportInfoFromESMCode = async (code: string) => {
  let ast: babel.types.File | babel.types.Program | null = null;
  try {
    ast = await babel.parseAsync(code, {
      plugins: [
        require('@babel/plugin-proposal-class-properties'),
        require('@babel/plugin-proposal-object-rest-spread'),
      ],
    });
  } catch (e: any) {
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line no-console
      console.log(e.message);
    }
  }
  if (!ast) {
    return null;
  }
  const localVariableNames = new Set<string>();
  const namedExportsOutsideCode = new Set<string>();
  const namedExportsInsideCode = new Set<string>();
  // exportName to localName, export { localName as exportName }
  const namedExportAlias: Record<string, string> = {};
  let hasDefaultExport = false;
  let defaultExportId = '';
  const defaultExportAssignedKeySet = new Set<string>();
  const addToSet = <T extends string>(s: Set<T>, k: T) => {
    if (ignoreKeys.includes(k)) {
      return;
    }
    s.add(k);
  };
  const addToDefaultExportAssignedKeySet = (k: string) => {
    addToSet(defaultExportAssignedKeySet, k);
  };
  babel.traverse(ast, {
    ExportDefaultDeclaration: path => {
      hasDefaultExport = true;
      const { declaration } = path.node;
      if (t.isIdentifier(declaration)) {
        // export default A;
        defaultExportId = declaration.name;
        const binding = path.scope.getBinding(defaultExportId);
        const defaultExportAlias: string[] = [];
        if (binding) {
          getAssignedKeys(binding);
          // var defaultExportId = otherAlias;
          findAlias(binding);
        }

        let alias: string | null | undefined = null;
        // eslint-disable-next-line no-cond-assign
        while ((alias = defaultExportAlias.pop())) {
          const binding = path.scope.getBinding(alias);
          if (binding) {
            getAssignedKeys(binding);
            findAlias(binding);
          }
        }

        function getAssignedKeys(binding: Binding) {
          // var defaultExportId = { k: 'xxx' };
          const { node } = binding.path;
          if (t.isVariableDeclarator(node)) {
            if (t.isObjectExpression(node.init)) {
              for (const propNode of node.init.properties) {
                // 1. objectProperty: var o = { a: 'a' }
                if (t.isObjectProperty(propNode)) {
                  if (t.isIdentifier(propNode.key)) {
                    addToDefaultExportAssignedKeySet(propNode.key.name);
                  }
                }
                // 2. objectMethod: var o = { a() {} }
                if (t.isObjectMethod(propNode)) {
                  if (t.isIdentifier(propNode.key)) {
                    addToDefaultExportAssignedKeySet(propNode.key.name);
                  }
                }
                // 3. spreadElement: var o = { ...other }
                if (t.isSpreadElement(propNode)) {
                  // FIXME: 这里可能是运行时才j决定的，暂时只管静态的情况
                  if (t.isIdentifier(propNode.argument)) {
                    const spreadElementBinding = path.scope.getBinding(
                      propNode.argument.name,
                    );
                    if (spreadElementBinding) {
                      getAssignedKeys(spreadElementBinding);
                    }
                  }
                }
              }
            }
          }

          const paths: babel.types.MemberExpression[] = binding.referencePaths
            .map(p => p.parent)
            .filter(p =>
              t.isMemberExpression(p),
            ) as babel.types.MemberExpression[];

          // defaultExportId.xxx = xxx;
          for (const p of paths) {
            if (t.isIdentifier(p.property)) {
              addToDefaultExportAssignedKeySet(p.property.name);
            }
          }
        }

        function findAlias(binding: Binding) {
          const n = binding.path.node;
          if (t.isVariableDeclarator(n)) {
            if (t.isIdentifier(n.init)) {
              defaultExportAlias.push(n.init.name);
            }
          }
        }
        Object.keys(path.scope.getAllBindings()).forEach(k => {
          localVariableNames.add(k);
        });
      }
    },
    ExportNamedDeclaration: path => {
      if (path.node.source) {
        // 来自其他模块的 reexport
        // 仅记录，未能处理
        for (const spec of path.node.specifiers) {
          if (t.isExportSpecifier(spec) && t.isIdentifier(spec.exported)) {
            namedExportsOutsideCode.add(spec.exported.name);

            // export { default } from 'foo';
            if (spec.exported.name === 'default') {
              hasDefaultExport = true;
            }
          }
        }
        return;
      }

      path.node.specifiers.forEach(d => {
        // export { A, B ,C as D };
        if (t.isExportSpecifier(d)) {
          if (t.isIdentifier(d.exported)) {
            addToSet(namedExportsInsideCode, d.exported.name);

            if (d.exported.name) {
              namedExportAlias[d.exported.name] = d.local.name;
            }
          }
        }
      });

      const { declaration } = path.node;
      if (t.isFunctionDeclaration(declaration)) {
        // export function Component() {}
        if (t.isIdentifier(declaration.id)) {
          addToSet(namedExportsInsideCode, declaration.id.name);
        }
      } else if (t.isVariableDeclaration(declaration)) {
        // export const X = xxxx, Y = xxx
        declaration.declarations.forEach((dd: t.VariableDeclarator) => {
          if (t.isIdentifier(dd.id)) {
            addToSet(namedExportsInsideCode, dd.id.name);
          }
        });
      }
    },
  });

  return {
    hasDefaultExport,
    defaultExportId,
    defaultExportAssignedKeySet,
    localVariableNames,
    namedExportsOutsideCode,
    namedExportsInsideCode,
    namedExportAlias,
  };
};

/* eslint-enable no-inner-declarations */
