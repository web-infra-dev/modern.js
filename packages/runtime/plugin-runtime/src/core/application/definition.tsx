import type { NestedRoute, PageRoute } from '@modern-js/types';
import React, { useContext, useEffect } from 'react';
import type { createRuntime } from '../plugin';
import {
  ScopedRootPropsContext,
  type TInternalRuntimeContext,
} from '../context/runtime';
import type {
  LoaderFunction,
  LoaderFunctionArgs,
  RouteManifest,
} from '../../router/runtime/types';

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

interface RouteCommitObservation {
  routes: Set<string>;
  errors: Set<string>;
  onCommit?: (id: string, error: boolean) => void;
}

export function instanceRoutes(
  definition: ApplicationDefinition,
  server = false,
  observation?: RouteCommitObservation,
  getDataUrl?: (url: URL) => URL,
  forwardRootProps = false,
): ApplicationDefinition['routes'] {
  const copy = (
    nodes: ApplicationDefinition['routes'],
  ): ApplicationDefinition['routes'] =>
    (nodes || []).map(node => {
      const result = { ...node };
      if (
        forwardRootProps &&
        node.type === 'nested' &&
        node.isRoot &&
        node.component
      ) {
        const Component = node.component as React.ComponentType<any>;
        (result as NestedRoute).component = function ApplicationLayout(
          props: Record<string, unknown> = {},
        ) {
          return (
            <Component {...props} {...useContext(ScopedRootPropsContext)} />
          );
        };
      }
      if (observation && node.type === 'nested' && node.id) {
        const nested = result as NestedRoute;
        const observe = (
          Component: React.ComponentType<any>,
          error: boolean,
        ) => {
          (error ? observation.errors : observation.routes).add(node.id!);
          const ObservedRoute = (props: Record<string, unknown> = {}) => {
            useEffect(() => observation.onCommit?.(node.id!, error), []);
            return <Component {...props} />;
          };
          // Keep the existing renderer's Loadable/fallback selection intact.
          if (Component.displayName === 'Loadable') {
            Object.assign(ObservedRoute, {
              displayName: Component.displayName,
              preload: (Component as any).preload,
            });
          }
          return ObservedRoute;
        };
        if (nested.component)
          nested.component = observe(
            nested.component as React.ComponentType<any>,
            false,
          );
        if (nested.error)
          nested.error = observe(
            nested.error as React.ComponentType<any>,
            true,
          );
      }
      if ('children' in node && node.children)
        (result as NestedRoute).children = copy(node.children) as NestedRoute[];
      if (
        node.type === 'nested' &&
        typeof node.loader === 'function' &&
        !node.clientData &&
        getDataUrl &&
        definition.serverLoaders &&
        !server
      ) {
        const loader = node.loader as LoaderFunction;
        (result as NestedRoute).loader = (args: LoaderFunctionArgs) => {
          const url = getDataUrl(new URL(args.request.url));
          return loader({ ...args, request: new Request(url, args.request) });
        };
      }
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
