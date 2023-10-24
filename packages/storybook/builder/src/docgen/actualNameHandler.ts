/**
 * This is heavily based on the react-docgen `displayNameHandler`
 * (https://github.com/reactjs/react-docgen/blob/26c90c0dd105bf83499a83826f2a6ff7a724620d/src/handlers/displayNameHandler.ts)
 * but instead defines an `actualName` property on the generated docs that is taken first from the component's actual name.
 * This addresses an issue where the name that the generated docs are stored under is incorrectly named with the `displayName`
 * and not the component's actual name.
 *
 * This is inspired by `actualNameHandler` from https://github.com/storybookjs/babel-plugin-react-docgen, but is modified
 * directly from displayNameHandler, using the same approach as babel-plugin-react-docgen.
 */

import { namedTypes as t } from 'ast-types';
import type { NodePath } from 'ast-types/lib/node-path';
import { getNameOrValue, isReactForwardRefCall } from 'react-docgen/dist/utils';
import type { Importer } from 'react-docgen/dist/parse';
import type Documentation from 'react-docgen/dist/Documentation';

export default function actualNameHandler(
  documentation: Documentation,
  path: NodePath,
  importer: Importer,
): void {
  if (
    t.ClassDeclaration.check(path.node) ||
    t.FunctionDeclaration.check(path.node)
  ) {
    documentation.set('actualName', getNameOrValue(path.get('id')));
  } else if (
    t.ArrowFunctionExpression.check(path.node) ||
    t.FunctionExpression.check(path.node) ||
    isReactForwardRefCall(path, importer)
  ) {
    let currentPath = path;
    while (currentPath.parent) {
      if (t.VariableDeclarator.check(currentPath.parent.node)) {
        documentation.set(
          'actualName',
          getNameOrValue(currentPath.parent.get('id')),
        );
        return;
      }
      if (t.AssignmentExpression.check(currentPath.parent.node)) {
        const leftPath = currentPath.parent.get('left');
        if (
          t.Identifier.check(leftPath.node) ||
          t.Literal.check(leftPath.node)
        ) {
          documentation.set('actualName', getNameOrValue(leftPath));
          return;
        }
      }
      currentPath = currentPath.parent;
    }
    // Could not find an actual name
    documentation.set('actualName', '');
  }
}
