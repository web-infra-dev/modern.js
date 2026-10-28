import {
  parseSync,
  type Expression,
  type Module,
  type CallExpression,
} from '@swc/core';
import { normalizeScopePath } from './select';

export interface RootExport {
  module: Module;
  entry: string | undefined;
  route: string | undefined;
  rootImport: string;
}

/** Resolve imported symbols and top-level consts, never execute application code. */
export function analyzeRootExport(
  source: string,
  filename: string,
  metaName: string,
): RootExport | undefined {
  const module = parseSync(source, {
    syntax: 'typescript',
    decorators: true,
    tsx: /\.[jt]sx$/.test(filename),
  });
  const constants = new Map<string, Expression>();
  const imported = new Map<string, { source: string; name: string }>();
  const registries: string[] = [];
  const declarations = module.body.flatMap(item =>
    item.type === 'ExportDeclaration' ? [item.declaration] : [item],
  );
  for (const item of declarations) {
    if (item.type === 'VariableDeclaration' && item.kind === 'const') {
      for (const declaration of item.declarations)
        if (declaration.id.type === 'Identifier' && declaration.init)
          constants.set(declaration.id.value, declaration.init);
    }
    if (item.type !== 'ImportDeclaration') continue;
    const from = item.source.value;
    if (
      from === `@${metaName}/runtime/registry` ||
      from.startsWith(`@${metaName}/runtime/registry/`)
    )
      registries.push(from);
    for (const specifier of item.specifiers)
      if (specifier.type === 'ImportSpecifier') {
        imported.set(specifier.local.value, {
          source: from,
          name: specifier.imported?.value || specifier.local.value,
        });
      }
  }
  const resolve = (
    expression: Expression,
    seen = new Set<string>(),
  ): Expression => {
    if (
      expression.type === 'TsAsExpression' ||
      expression.type === 'TsSatisfiesExpression' ||
      expression.type === 'TsConstAssertion' ||
      expression.type === 'TsTypeAssertion' ||
      expression.type === 'TsNonNullExpression' ||
      expression.type === 'ParenthesisExpression'
    )
      return resolve(expression.expression, seen);
    if (expression.type !== 'Identifier' || !constants.has(expression.value))
      return expression;
    if (seen.has(expression.value))
      throw new Error('Circular constant in Modern root definition.');
    return resolve(
      constants.get(expression.value)!,
      new Set([...seen, expression.value]),
    );
  };
  const isCall = (
    expression: Expression,
    name: string,
    from: string,
  ): expression is CallExpression =>
    expression.type === 'CallExpression' &&
    expression.callee.type === 'Identifier' &&
    imported.get(expression.callee.value)?.name === name &&
    imported.get(expression.callee.value)?.source === from;
  const exports = module.body.flatMap(item =>
    item.type === 'ExportDefaultExpression' ? [resolve(item.expression)] : [],
  );
  const providers = exports.filter(expression =>
    [
      `@${metaName}/runtime/mf`,
      '@module-federation/bridge-react',
      '@module-federation/bridge-react/v18',
      '@module-federation/bridge-react/v19',
    ].some(from => isCall(expression, 'createBridgeComponent', from)),
  );
  if (!providers.length) return;
  const provider = providers[0] as CallExpression;
  const options =
    provider.arguments[0] && resolve(provider.arguments[0].expression);
  if (options?.type !== 'ObjectExpression') return;
  const root = options.properties.find(property =>
    property.type === 'Identifier'
      ? property.value === 'rootComponent'
      : property.type === 'KeyValueProperty' &&
        (property.key.type === 'Identifier' ||
          property.key.type === 'StringLiteral') &&
        property.key.value === 'rootComponent',
  );
  if (!root || (root.type !== 'KeyValueProperty' && root.type !== 'Identifier'))
    return;
  const call = resolve(root.type === 'Identifier' ? root : root.value);
  if (!isCall(call, 'createRoot', `@${metaName}/runtime/react`)) return;
  const otherRoots = [...constants.values()].filter(
    value =>
      isCall(resolve(value), 'createRoot', `@${metaName}/runtime/react`) &&
      resolve(value) !== call,
  );
  if (otherRoots.length)
    throw new Error(
      'Define each Modern application Root in its own expose module.',
    );
  if (
    call.arguments.length > 1 ||
    call.arguments.some(argument => argument.spread)
  )
    throw new Error('Modern root options must be statically defined.');
  let route: string | undefined;
  if (call.arguments.length) {
    const argument = resolve(call.arguments[0].expression);
    if (
      argument.type === 'NullLiteral' ||
      (argument.type === 'Identifier' && argument.value === 'undefined')
    ) {
      // Existing null/undefined application roots remain whole-application roots.
    } else if (argument.type === 'ObjectExpression') {
      for (const property of argument.properties) {
        if (property.type === 'Identifier' && property.value === 'route') {
          const value = resolve(property);
          if (value.type !== 'StringLiteral')
            throw new Error('route must be a statically known string.');
          route = normalizeScopePath(value.value);
          continue;
        }
        if (
          property.type !== 'KeyValueProperty' ||
          !['Identifier', 'StringLiteral'].includes(property.key.type)
        )
          throw new Error('Modern root options must be static properties.');
        const key = property.key as { value: string };
        if (key.value !== 'route')
          throw new Error(`Unsupported createRoot option "${key.value}".`);
        const value = resolve(property.value);
        if (value.type === 'Identifier' && value.value === 'undefined')
          continue;
        if (value.type !== 'StringLiteral')
          throw new Error('route must be a statically known string.');
        route = normalizeScopePath(value.value);
      }
    } else {
      // The legacy component overload is not an application-scope declaration.
      return;
    }
  }
  if (registries.length !== 1)
    throw new Error(
      'A Modern application expose must import exactly one runtime registry in its root definition module.',
    );
  const registry = registries[0];
  return {
    module,
    entry:
      registry === `@${metaName}/runtime/registry`
        ? undefined
        : registry.slice(`@${metaName}/runtime/registry/`.length),
    route,
    rootImport: (call.callee as { value: string }).value,
  };
}
