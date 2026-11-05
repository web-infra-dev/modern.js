import { cancellationPlugin } from '../application/cancellation';
import {
  getApplicationRoutes,
  cloneRoutes,
} from '../../router/runtime/application';
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

// These contain only static components and observed route identifiers, never request data.
const scopedDefinitions = new WeakMap<
  ScopedRootDefinition,
  Array<{
    definition: ScopedRootDefinition;
    routes?: ReadonlySet<string>;
    errors?: ReadonlySet<string>;
  }>
>();
function getScopedDefinition(
  definition: ScopedRootDefinition,
  observe: boolean,
) {
  let variants = scopedDefinitions.get(definition);
  if (!variants) scopedDefinitions.set(definition, (variants = []));
  const index = Number(observe);
  if (variants[index]) return variants[index];
  const observedRoutes = observe ? new Set<string>() : undefined;
  const observedErrors = observe ? new Set<string>() : undefined;
  const routes = cloneRoutes(definition.routes, node => {
    if (node.type !== 'nested') return;
    if (node.isRoot && node.component) {
      const Component = node.component as React.ComponentType<any>;
      node.component = function ApplicationLayout(
        props: Record<string, unknown> = {},
      ) {
        return <Component {...props} {...useContext(ScopedRootPropsContext)} />;
      };
    }
    if (!observe || !node.id) return;
    const wrap = (Component: React.ComponentType<any>, error: boolean) => {
      (error ? observedErrors : observedRoutes)!.add(node.id!);
      const ObservedRoute = (props: Record<string, unknown> = {}) => {
        const instance = useContext(PreparedScopeContext);
        useEffect(
          () => instance?.routeCommits?.onCommit?.(node.id!, error),
          [instance],
        );
        return <Component {...props} />;
      };
      if (Component.displayName === 'Loadable')
        Object.assign(ObservedRoute, {
          displayName: Component.displayName,
          preload: (Component as any).preload,
        });
      return ObservedRoute;
    };
    if (node.component)
      node.component = wrap(node.component as React.ComponentType<any>, false);
    if (node.error)
      node.error = wrap(node.error as React.ComponentType<any>, true);
  })!;
  return (variants[index] = {
    definition: { ...definition, routes },
    routes: observedRoutes,
    errors: observedErrors,
  });
}

export function createScopeRuntime(
  definition: ScopedRootDefinition,
  options: Omit<ApplicationEnvironment, 'output'> & {
    basename?: string;
    memory?: boolean;
    signal?: AbortSignal;
    onError?: (error: unknown) => void;
    observeRouteCommits?: boolean;
    onRouteCommit?: (id: string, error: boolean) => void;
  },
) {
  const {
    observeRouteCommits,
    onRouteCommit,
    signal,
    onError,
    basename = '/',
    memory,
    ...environment
  } = options;
  const compiled = getScopedDefinition(
    definition,
    Boolean(observeRouteCommits),
  );
  const getDataUrl = environment.isBrowser
    ? (url: URL) => getScopeDataUrl(definition, basename, url)
    : undefined;
  const data: import('../plugin').RuntimePlugin | undefined =
    getDataUrl && definition.serverLoaders
      ? {
          name: '@modern-js/runtime-fragment-data',
          setup(api) {
            getApplicationRoutes(api.getRuntimeContext(), node => {
              if (
                node.type !== 'nested' ||
                typeof node.loader !== 'function' ||
                node.clientData
              )
                return;
              const loader = node.loader as LoaderFunction;
              node.loader = (args: LoaderFunctionArgs) =>
                loader({
                  ...args,
                  request: new Request(
                    getDataUrl(new URL(args.request.url)),
                    args.request,
                  ),
                });
            });
          },
        }
      : undefined;
  const instance = createApplicationInstance(definition, {
    ...environment,
    output: 'fragment',
    plugins: [
      cancellationPlugin(signal, onError),
      ...(data ? [data] : []),
      ...(environment.plugins || []),
    ],
  });
  Object.assign(instance.context.application!, {
    definition: compiled.definition,
    basename,
    memory,
  });
  if (getDataUrl) instance.context.application!.getDataUrl = getDataUrl;
  return Object.assign(instance, {
    routeCommits: observeRouteCommits
      ? {
          routes: compiled.routes!,
          errors: compiled.errors!,
          onCommit: onRouteCommit,
        }
      : undefined,
  });
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
