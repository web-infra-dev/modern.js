import nodePath from 'path';
import { CORE_JS_PATH } from '@modern-js/utils';
import * as t from '@babel/types';

const REWRITE_TARGETS: Record<string, string> = {
  '@babel/runtime': nodePath.dirname(
    require.resolve('@babel/runtime/package.json'),
  ),
  'core-js': nodePath.dirname(CORE_JS_PATH),
};

const matchedKey = (value: string) =>
  Object.keys(REWRITE_TARGETS).find(name => value.startsWith(`${name}/`));

export default (_: any) => {
  return {
    post({ path }: any) {
      path.node.body.forEach((node: t.Node) => {
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
      });
    },
  };
};
