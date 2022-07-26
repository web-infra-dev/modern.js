import fs from 'fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

const isFunction = (
  node:
    | t.FunctionDeclaration
    | t.ClassDeclaration
    | t.TSDeclareFunction
    | t.Expression,
) =>
  t.isFunctionDeclaration(node) ||
  t.isFunctionExpression(node) ||
  t.isArrowFunctionExpression(node);

export const isDefaultExportFunction = (file: string | false): boolean => {
  if (!file || !fs.existsSync(file)) {
    return false;
  }

  const ast = parse(fs.readFileSync(file, 'utf8'), {
    sourceType: 'unambiguous',
    plugins: [
      'jsx',
      'typescript',
      'classProperties',
      'dynamicImport',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'decorators-legacy',
      'functionBind',
      'classPrivateMethods',
      ['pipelineOperator', { proposal: 'minimal' }],
      'optionalChaining',
      'optionalCatchBinding',
      'objectRestSpread',
      'numericSeparator',
    ],
  });

  let isExportFunction = false;
  traverse(ast, {
    ExportDefaultDeclaration: path => {
      const { declaration } = path.node;
      if (isFunction(declaration as any)) {
        isExportFunction = true;
      }
    },
  });
  return isExportFunction;
};
