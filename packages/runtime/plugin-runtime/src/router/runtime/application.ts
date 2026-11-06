import type { NestedRoute, PageRoute } from '@modern-js/types';
import type { TInternalRuntimeContext } from '../../core/context/runtime';
import type { InstanceRouteDecorator } from '../../core/application/definition';

export function cloneRoutes(
  nodes?: (NestedRoute | PageRoute)[],
  decorate?: InstanceRouteDecorator,
): typeof nodes {
  return nodes?.map(node => {
    const result = { ...node };
    if ('children' in node)
      result.children = cloneRoutes(node.children, decorate) as NestedRoute[];
    decorate?.(result);
    return result;
  });
}

/** Mutable declarations are allocated only when the routing capability is used. */
export function getApplicationRoutes(
  context: TInternalRuntimeContext,
  decorate?: InstanceRouteDecorator,
) {
  const application = context.application!;
  return (application.config ||= {
    routes: cloneRoutes(application.definition.routes, decorate),
    globalApp: application.definition.globalApp,
  });
}
