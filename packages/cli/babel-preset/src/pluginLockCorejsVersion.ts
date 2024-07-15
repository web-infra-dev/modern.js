import { readFileSync } from 'node:fs';
import nodePath from 'node:path';
import * as t from '@babel/types';

const CORE_JS_PKG_PATH = require.resolve('core-js/package.json');

const REWRITE_TARGETS: Record<string, string> = {
  '@babel/runtime': nodePath.dirname(
    require.resolve('@babel/runtime/package.json'),
  ),
  'core-js': nodePath.dirname(CORE_JS_PKG_PATH),
};

const matchedKey = (value: string) =>
  Object.keys(REWRITE_TARGETS).find((name) => value.startsWith(`${name}/`));

export const getCoreJsVersion = (): string => {
  try {
    const { version } = JSON.parse(readFileSync(CORE_JS_PKG_PATH, 'utf-8'));
    const [major, minor] = version.split('.');
    return `${major}.${minor}`;
  } catch (err) {
    return '3';
  }
};

export default (_: any) => {
  return {
    post({ path }: any): void {
      for (const node of path.node.body as t.Node[]) {
        // import
        if (t.isImportDeclaration(node)) {
          const key = matchedKey(node.source.value);
          if (key) {
            node.source.value = node.source.value.replace(
              new RegExp(`^${key}\\/`),
              `${REWRITE_TARGETS[key]}/`,
            );
          }
        }
        // require
        else if (
          t.isExpressionStatement(node) &&
          t.isCallExpression(node.expression)
        ) {
          const { callee } = node.expression;
          const source = node.expression.arguments[0];
          if (t.isIdentifier(callee) && callee.name === 'require') {
            const key = matchedKey((source as any).value);
            if (key) {
              (source as any).value = (source as any).value.replace(
                new RegExp(`^${key}\\/`),
                `${REWRITE_TARGETS[key]}/`,
              );
            }
          }
        }
      }
    },
  };
};
