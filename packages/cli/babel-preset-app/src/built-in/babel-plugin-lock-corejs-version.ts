import { path as pathUtils } from '@modern-js/utils';
import * as t from '@babel/types';

const REWRITE_TARGETS = {
  '@babel/runtime': pathUtils.dirname(
    require.resolve('@babel/runtime/package.json'),
  ),
  'regenerator-runtime': pathUtils.dirname(
    require.resolve('regenerator-runtime'),
  ),
  'core-js': pathUtils.dirname(require.resolve('core-js/package.json')),
};

const matchedKey = (value: string) =>
  Object.keys(REWRITE_TARGETS).find(name => value.startsWith(`${name}/`));

export default () => ({
  post({ path, ...stats }: any) {
    const { sourceFileName } = stats.opts;

    if (/node_modules(?!\/\.modern-js\/)/.test(sourceFileName)) {
      return;
    }

    path.node.body.forEach((node: t.Node) => {
      // import
      if (t.isImportDeclaration(node)) {
        const key = matchedKey(node.source.value);
        if (key) {
          node.source.value = node.source.value.replace(
            new RegExp(`^${key}\\/`),
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            `${REWRITE_TARGETS[key]}/`,
          );
        }
      }

      // require
      if (
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
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              `${REWRITE_TARGETS[key]}/`,
            );
          }
        }
      }
    });
  },
});
