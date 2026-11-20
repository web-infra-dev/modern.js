/** Find the binding itself so a read of a shadowed name does not count as use. */
function findVariable(sourceCode, identifier) {
  let scope = sourceCode.getScope(identifier);
  while (scope) {
    const variable = scope.variables.find(binding =>
      binding.identifiers.includes(identifier),
    );
    if (variable) return variable;
    scope = scope.upper;
  }
}

/** Exports and signature-only parameters are consumed outside this body. */
function isExternalBinding(identifier) {
  let node = identifier;
  while (node.parent) {
    const parent = node.parent;
    if (parent.type === 'VariableDeclaration') {
      return parent.declare || parent.parent?.type === 'ExportNamedDeclaration';
    }
    if (parent.params?.includes(node)) return !parent.body;
    node = parent;
  }
  return false;
}

function isUsed(variable) {
  return (
    variable?.eslintUsed ||
    variable?.identifiers.some(isExternalBinding) ||
    variable?.references.some(reference => reference.isRead())
  );
}

const noUnusedDestructuring = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow unused object destructuring bindings hidden by an underscore prefix.',
    },
    schema: [],
    messages: {
      unused:
        "Destructured binding '{{name}}' is unused. Remove the unused destructuring instead of hiding it with an underscore prefix.",
    },
  },
  create(context) {
    const patterns = [];
    const { sourceCode } = context;

    return {
      ObjectPattern(node) {
        patterns.push(node);
      },
      'Program:exit'() {
        for (const pattern of patterns) {
          const rest = pattern.properties.find(
            property => property.type === 'RestElement',
          );
          const usesRest =
            rest?.argument.type === 'Identifier' &&
            isUsed(findVariable(sourceCode, rest.argument));

          for (const property of pattern.properties) {
            if (property.type !== 'Property' && property.type !== 'RestElement')
              continue;
            if (property.type === 'Property' && usesRest) continue;

            let binding =
              property.type === 'RestElement'
                ? property.argument
                : property.value;
            if (binding.type === 'AssignmentPattern') binding = binding.left;
            if (binding.type !== 'Identifier' || !binding.name.startsWith('_'))
              continue;

            const variable = findVariable(sourceCode, binding);
            if (!variable || isUsed(variable)) continue;
            context.report({
              node: binding,
              messageId: 'unused',
              data: { name: binding.name },
            });
          }
        }
      },
    };
  },
};

export const modernLintPlugin = {
  meta: { name: 'modern-js-repository-lint' },
  rules: { 'no-unused-destructuring': noUnusedDestructuring },
};
