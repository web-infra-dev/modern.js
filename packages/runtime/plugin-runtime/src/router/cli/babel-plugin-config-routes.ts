import * as t from '@babel/types';

/**
 * @description find { component: value } or { "component": value }
 */
const isTargetProp = (node: any, prop: string): boolean =>
  node.key.name === prop || node.key.value === prop;

function RoutesBabel(
  _: unknown,
  { lazy }: { lazy: boolean },
): Record<string, any> {
  return {
    visitor: {
      ObjectExpression(path: any): void {
        const component = path.node.properties.find((e: any) =>
          isTargetProp(e, 'component'),
        );
        if (!lazy && component) {
          path.node.properties = [
            ...path.node.properties,
            t.objectProperty(t.identifier('module'), component.value),
          ];
        }
      },
      ObjectProperty(path: any): void {
        if (isTargetProp(path.node, 'module')) {
          // item.module = require(path)
          if (!lazy) {
            path.node.value = t.callExpression(t.identifier('require'), [
              path.node.value,
            ]);
            return;
          }
        }
        if (isTargetProp(path.node, 'component')) {
          // item.component = require(path).default
          if (lazy) {
            // item.component = loadable(() => import(path))
            path.node.value = t.callExpression(t.identifier('loadable'), [
              t.arrowFunctionExpression(
                [],
                t.callExpression(t.import(), [path.node.value]),
              ),
            ]);
          } else {
            path.node.value = t.memberExpression(
              t.callExpression(t.identifier('require'), [path.node.value]),
              t.identifier('default'),
            );
            return;
          }
          //   if (lazy === true) {
          //     // item.component = React.lazy(() => import(path))
          //     path.node.value = t.callExpression(
          //       t.memberExpression(t.identifier('React'), t.identifier('lazy')),
          //       [
          //         t.arrowFunctionExpression(
          //           [],
          //           t.callExpression(t.import(), [path.node.value]),
          //         ),
          //       ],
          //     );
          //   }
          if (lazy) {
            // item.component = loadable(() => import(path))
            path.node.value = t.callExpression(t.identifier('loadable'), [
              t.arrowFunctionExpression(
                [],
                t.callExpression(t.import(), [path.node.value]),
              ),
            ]);
          }
        }
      },
    },
  };
}

export default RoutesBabel;
