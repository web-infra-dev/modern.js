import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
import type {
  LoaderFunction,
  LoaderFunctionArgs,
} from '../../router/runtime/types';
import { addBasename, removeBasename } from '../../mf/location';
import {
  createApplicationInstance,
  type ApplicationEnvironment,
} from '../application/instance';
import {
  type ApplicationDefinition,
  getApplicationDefinition,
  registerApplicationRoot,
} from '../application/definition';

export const ScopedRootPropsContext = createContext<Record<string, unknown>>(
  {},
);

export interface ScopedRootDefinition extends ApplicationDefinition {
  routes: NonNullable<ApplicationDefinition['routes']>;
  dataRoute?: string;
  getDataBase: () => string;
}
export const registerScopedRoot = registerApplicationRoot;
export const getScopedRootDefinition = getApplicationDefinition as (
  Root: React.ComponentType<any>,
) => ScopedRootDefinition | undefined;

/** Translate only data requests to the producer's standalone route endpoint. */
export function getScopeDataUrl(
  definition: ScopedRootDefinition,
  routeBasename: string,
  input: URL,
): URL {
  const url = new URL(input);
  const producer = new URL(definition.getDataBase());
  url.protocol = producer.protocol;
  url.hostname = producer.hostname;
  url.port = producer.port;
  url.pathname = addBasename(
    addBasename(
      removeBasename(url.pathname, routeBasename) ?? url.pathname,
      definition.dataRoute || '/',
    ),
    definition.basename || '/',
  );
  return url;
}

export function createScopeRuntime(
  definition: ScopedRootDefinition,
  options: Omit<ApplicationEnvironment, 'output' | 'decorateRoute'> & {
    observeRouteCommits?: boolean;
    onRouteCommit?: (id: string, error: boolean) => void;
  },
) {
  const { observeRouteCommits, onRouteCommit, ...environment } = options;
  const routeCommits = observeRouteCommits
    ? {
        routes: new Set<string>(),
        errors: new Set<string>(),
        onCommit: onRouteCommit,
      }
    : undefined;
  const basename = environment.basename || '/';
  const getDataUrl = (url: URL) => getScopeDataUrl(definition, basename, url);
  const instance = createApplicationInstance(definition, {
    ...environment,
    output: 'fragment',
    getDataUrl,
    decorateRoute(node) {
      if (node.type !== 'nested') return;
      if (node.isRoot && node.component) {
        const Component = node.component as React.ComponentType<any>;
        node.component = function ApplicationLayout(
          props: Record<string, unknown> = {},
        ) {
          return (
            <Component {...props} {...useContext(ScopedRootPropsContext)} />
          );
        };
      }
      if (routeCommits && node.id) {
        const observe = (
          Component: React.ComponentType<any>,
          error: boolean,
        ) => {
          (error ? routeCommits.errors : routeCommits.routes).add(node.id!);
          const ObservedRoute = (props: Record<string, unknown> = {}) => {
            useEffect(() => routeCommits.onCommit?.(node.id!, error), []);
            return <Component {...props} />;
          };
          // Preserve the router renderer's Loadable/fallback selection.
          if (Component.displayName === 'Loadable') {
            Object.assign(ObservedRoute, {
              displayName: Component.displayName,
              preload: (Component as any).preload,
            });
          }
          return ObservedRoute;
        };
        if (node.component)
          node.component = observe(
            node.component as React.ComponentType<any>,
            false,
          );
        if (node.error)
          node.error = observe(node.error as React.ComponentType<any>, true);
      }
      if (
        typeof node.loader === 'function' &&
        !node.clientData &&
        definition.serverLoaders &&
        environment.isBrowser
      ) {
        const loader = node.loader as LoaderFunction;
        node.loader = (args: LoaderFunctionArgs) => {
          const url = getDataUrl(new URL(args.request.url));
          return loader({ ...args, request: new Request(url, args.request) });
        };
      }
    },
  });
  return Object.assign(instance, { routeCommits });
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
