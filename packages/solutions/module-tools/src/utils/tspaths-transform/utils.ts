import { Import } from '@modern-js/utils';
import type * as tt from '@babel/types';
import type { NodePath } from '@babel/traverse';

const t: typeof import('@babel/types') = Import.lazy('@babel/types', require);

export function matchesPattern(calleePath: NodePath, pattern: string) {
  const { node } = calleePath;

  if (t.isMemberExpression(node)) {
    return calleePath.matchesPattern(pattern);
  }

  if (!t.isIdentifier(node) || pattern.includes('.')) {
    return false;
  }

  const name = pattern.split('.')[0];

  return node.name === name;
}

export function isImportCall(calleePath: NodePath<tt.CallExpression>) {
  return t.isImport(calleePath.node.callee);
}
