import { useBridgeRouter } from '@module-federation/bridge-react/base';
import {
  addBasename,
  createBrowserRouterConnector,
  createMountWindow,
  normalizeBasename,
  removeBasename,
} from '../../mf/navigation';
import type { NestedRoute, PageRoute } from '@modern-js/types';
import React, { useContext, useEffect, useState } from 'react';
import { createRoot as createReactRoot, type Root } from 'react-dom/client';
import { getInitialContext, ScopedRootPropsContext } from '../context/runtime';
import type { createRuntime } from '../plugin';
import { wrapRuntimeContextProvider } from './wrapper';
import type {
  LoaderFunction,
  LoaderFunctionArgs,
  RouterConfig,
} from '../../router/runtime/types';

export interface ScopedRootDefinition {
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

function instanceRoutes(
  definition: ScopedRootDefinition,
  routeBasename: string,
) {
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
      if ('children' in node && node.children)
        (result as NestedRoute).children = copy(node.children) as NestedRoute[];
      if (
        node.type === 'nested' &&
        typeof node.loader === 'function' &&
        !node.clientData &&
        definition.serverLoaders
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

/** Static definitions may be shared. Context, hooks and router belong to a mount. */
export function createScopedRoot(
  definition: ScopedRootDefinition,
): React.ComponentType<any> {
  function ScopedRootInstance({
    props,
    bridge,
    basename,
  }: {
    props: Record<string, unknown>;
    bridge: ReturnType<typeof useBridgeRouter>;
    basename: string;
  }) {
    const navigation = bridge?.memoryRoute ? undefined : bridge?.navigation;
    const [instance] = useState(() => {
      const context = getInitialContext(true, { routeAssets: {} });
      const memory = Boolean(bridge?.memoryRoute);
      const routeBasename = memory ? '/' : basename;
      const mountWindow = memory
        ? undefined
        : createMountWindow(
            () => context._routeScope?.router,
            () => context._routeScope?.hash === true,
          );
      context._routeScope = {
        config: {
          routes: instanceRoutes(definition, routeBasename),
          globalApp: definition.globalApp,
        },
        memory,
        basename: routeBasename,
        getWindow: mountWindow ? () => mountWindow.window : undefined,
        initialUrl: bridge?.memoryRoute?.entryPath ?? '/',
      };
      const runtime = definition.createRuntime(
        context._routeScope.config,
        definition.selected,
      );
      runtime.pluginAPI!.updateRuntimeContext(context);
      context._internalContext = runtime;
      const WrappedRoot = runtime.hooks.wrapRoot.call(
        definition.App!,
      ) as React.ComponentType<any>;
      return {
        context,
        runtime,
        WrappedRoot,
        notifyPeers: mountWindow?.notifyPeers,
        initialization: undefined as Promise<unknown> | undefined,
        connection: undefined as
          ReturnType<typeof createBrowserRouterConnector> | undefined,
      };
    });
    const [ready, setReady] = useState(0);
    const [failure, setFailure] = useState<unknown>();
    useEffect(() => {
      let active = true;
      const scope = instance.context._routeScope!;
      const connection = scope.memory
        ? undefined
        : createBrowserRouterConnector(
            undefined,
            setFailure,
            () => scope.hash === true,
            instance.notifyPeers,
          );
      instance.connection = connection;
      // This owner is committed before ready renders the Router. Attaching
      // observes immediately, while Core queues notifications outside render.
      scope.onRouterCreated = connection?.attach;
      Promise.resolve()
        .then(() => {
          // StrictMode may clean up this setup before its microtask runs.
          if (active)
            return (instance.initialization ??=
              instance.runtime.hooks.onBeforeRender.call(instance.context));
        })
        .then(
          () => {
            if (active) setReady(version => version + 1);
          },
          error => {
            if (active)
              setFailure(
                error instanceof Error ? error : new Error(String(error)),
              );
          },
        );
      return () => {
        active = false;
        connection?.dispose();
        instance.connection = undefined;
        scope.onRouterCreated = undefined;
        scope.router?.dispose();
        scope.router = undefined;
        scope.routes = undefined;
      };
    }, [instance]);
    useEffect(() => {
      instance.connection?.setNavigation(navigation);
    }, [instance, navigation]);
    if (failure) throw failure;
    if (!ready) return null;
    const { WrappedRoot } = instance;
    return wrapRuntimeContextProvider(
      <ScopedRootPropsContext.Provider value={props}>
        <WrappedRoot {...props} />
      </ScopedRootPropsContext.Provider>,
      instance.context,
    );
  }
  return function ModernScopedRoot(props: Record<string, unknown>) {
    const bridge = useBridgeRouter();
    const basename = normalizeBasename(
      bridge?.basename ??
        (typeof props.basename === 'string' ? props.basename : '/'),
    );
    return (
      <ScopedRootInstance
        key={basename}
        props={props}
        bridge={bridge}
        basename={basename}
      />
    );
  };
}

/** Core calls custom render callbacks on updates too, so retain the DOM root. */
export function createScopedRender() {
  const roots = new WeakMap<HTMLElement, Root>();
  return async (
    element: React.ReactElement,
    container?: HTMLElement | string,
  ) => {
    const dom =
      typeof container === 'string'
        ? document.getElementById(container)
        : container;
    if (!dom)
      throw new Error('Modern application render requires a mount container.');
    let root = roots.get(dom);
    if (!root) {
      const reactRoot = createReactRoot(dom);
      root = {
        render: next => reactRoot.render(next),
        unmount: () => {
          roots.delete(dom);
          reactRoot.unmount();
        },
      };
      roots.set(dom, root);
    }
    root.render(element);
    return root;
  };
}
