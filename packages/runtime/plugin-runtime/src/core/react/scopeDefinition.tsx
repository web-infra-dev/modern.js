import type { NestedRoute, PageRoute } from '@modern-js/types';
import React, { createContext, useContext, useEffect } from 'react';
import type { createRuntime } from '../plugin';
import { getInitialContext, ScopedRootPropsContext } from '../context/runtime';
import { addBasename, removeBasename } from '../../mf/navigation';
import type {
  LoaderFunction,
  LoaderFunctionArgs,
  RouterConfig,
} from '../../router/runtime/types';

export interface ScopedRootDefinition {
  entryName?: string;
  routes: (NestedRoute | PageRoute)[];
  globalApp?: React.ComponentType<any>;
  App?: React.ComponentType<any>;
  createRuntime: (
    routesConfig: RouterConfig['routesConfig'],
    selected: boolean,
  ) => ReturnType<typeof createRuntime>;
  selected: boolean;
  /** Original producer path used only when requesting server loader data. */
  dataRoute?: string;
  basename: string;
  serverLoaders: boolean;
  getDataBase: () => string;
}

interface RouteCommitObservation {
  routes: Set<string>;
  errors: Set<string>;
  onCommit?: (id: string, error: boolean) => void;
}

export function instanceRoutes(
  definition: ScopedRootDefinition,
  routeBasename: string,
  server = false,
  observation?: RouteCommitObservation,
): ScopedRootDefinition['routes'] {
  const copy = (
    nodes: ScopedRootDefinition['routes'],
  ): ScopedRootDefinition['routes'] =>
    nodes.map(node => {
      const result = { ...node };
      if (node.type === 'nested' && node.isRoot && node.component) {
        const Component = node.component as React.ComponentType<any>;
        (result as NestedRoute).component = function ScopedLayout() {
          return <Component {...useContext(ScopedRootPropsContext)} />;
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
        definition.serverLoaders &&
        !server
      ) {
        const loader = node.loader as LoaderFunction;
        (result as NestedRoute).loader = (args: LoaderFunctionArgs) => {
          const url = new URL(args.request.url);
          const producer = new URL(definition.getDataBase());
          url.protocol = producer.protocol;
          url.hostname = producer.hostname;
          url.port = producer.port;
          // Server endpoints retain the producer's standalone route paths.
          // This translation is confined to data requests, never Router location.
          url.pathname = addBasename(
            addBasename(
              removeBasename(url.pathname, routeBasename) ?? url.pathname,
              definition.dataRoute || '/',
            ),
            definition.basename || '/',
          );
          return loader({ ...args, request: new Request(url, args.request) });
        };
      }
      return result;
    });
  return copy(definition.routes);
}

const definitions = new WeakMap<
  React.ComponentType<any>,
  ScopedRootDefinition
>();
export function registerScopedRoot<T extends React.ComponentType<any>>(
  Root: T,
  definition: ScopedRootDefinition,
): T {
  definitions.set(Root, definition);
  return Root;
}
export function getScopedRootDefinition(Root: React.ComponentType<any>) {
  return definitions.get(Root);
}

export function createScopeRuntime(
  definition: ScopedRootDefinition,
  options: {
    isBrowser: boolean;
    basename: string;
    initialUrl: string;
    memory?: boolean;
    observeRouteCommits?: boolean;
    onRouteCommit?: (id: string, error: boolean) => void;
  },
) {
  const context = getInitialContext(options.isBrowser, { routeAssets: {} });
  const routeCommits = options.observeRouteCommits
    ? {
        routes: new Set<string>(),
        errors: new Set<string>(),
        onCommit: options.onRouteCommit,
      }
    : undefined;
  context._routeScope = {
    config: {
      routes: instanceRoutes(
        definition,
        options.basename,
        !options.isBrowser,
        routeCommits,
      ),
      globalApp: definition.globalApp,
    },
    basename: options.basename,
    initialUrl: options.initialUrl,
    memory: options.memory,
  };
  const runtime = definition.createRuntime(
    context._routeScope.config,
    definition.selected,
  );
  runtime.pluginAPI!.updateRuntimeContext(context);
  context._internalContext = runtime;
  const Root = runtime.hooks.wrapRoot.call(
    definition.App!,
  ) as React.ComponentType<any>;
  return { definition, context, runtime, Root, routeCommits };
}
export type PreparedScope = ReturnType<typeof createScopeRuntime> & {
  setNavigation?: (
    navigation:
      | import('@module-federation/bridge-react/base').BridgeNavigation
      | undefined,
  ) => void;
};
export const PreparedScopeContext = createContext<PreparedScope | undefined>(
  undefined,
);

export function PreparedScopedRoot({
  instance,
  props,
}: {
  instance: PreparedScope;
  props: Record<string, unknown>;
}) {
  const { Root } = instance;
  return (
    <ScopedRootPropsContext.Provider value={props}>
      <Root {...props} />
    </ScopedRootPropsContext.Provider>
  );
}
