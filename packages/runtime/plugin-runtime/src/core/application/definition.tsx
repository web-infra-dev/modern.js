import type { NestedRoute, PageRoute } from '@modern-js/types';
import type React from 'react';
import type { createRuntime } from '../plugin';
import type { TInternalRuntimeContext } from '../context/runtime';
import type { RouteManifest } from '../../router/runtime/types';

/** Immutable code and build resources. Mutable state belongs to an instance. */
export interface ApplicationDefinition {
  entryName?: string;
  routes?: (NestedRoute | PageRoute)[];
  globalApp?: React.ComponentType<any>;
  App?: React.ComponentType<any>;
  createRuntime: (
    context: TInternalRuntimeContext,
  ) => ReturnType<typeof createRuntime>;
  selected?: boolean;
  basename?: string;
  serverLoaders?: boolean;
  enableRsc?: boolean;
  isRscClient?: boolean;
  RSCRoot?: React.ComponentType;
  getRouteManifest?: () => RouteManifest;
  loadRouteChunk?: (chunkId: string | number) => Promise<unknown>;
}

export type InstanceRouteDecorator = (route: NestedRoute | PageRoute) => void;

export function instanceRoutes(
  definition: ApplicationDefinition,
  decorateRoute?: InstanceRouteDecorator,
): ApplicationDefinition['routes'] {
  const copy = (
    nodes: ApplicationDefinition['routes'],
  ): ApplicationDefinition['routes'] =>
    (nodes || []).map(node => {
      const result = { ...node };
      if ('children' in node && node.children)
        (result as NestedRoute).children = copy(node.children) as NestedRoute[];
      decorateRoute?.(result);
      return result;
    });
  return copy(definition.routes);
}

const definitions = new WeakMap<
  React.ComponentType<any>,
  ApplicationDefinition
>();
export function registerApplicationRoot<T extends React.ComponentType<any>>(
  Root: T,
  definition: ApplicationDefinition,
): T {
  definitions.set(Root, definition);
  return Root;
}
export function getApplicationDefinition(Root: React.ComponentType<any>) {
  return definitions.get(Root);
}
