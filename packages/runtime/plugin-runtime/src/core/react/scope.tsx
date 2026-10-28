import { useBridgeRouter } from '@module-federation/bridge-react/base';
import {
  addBasename,
  connectRemoteRouter,
  translateLocation,
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
  route?: string;
  basename: string;
  serverLoaders: boolean;
  getDataBase: () => string;
}

function instanceRoutes(definition: ScopedRootDefinition) {
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
          url.host = producer.host;
          const base = definition.basename.replace(/\/$/, '');
          if (
            base &&
            !url.pathname.startsWith(`${base}/`) &&
            url.pathname !== base
          )
            url.pathname = `${base}${url.pathname}`;
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
  return function ModernScopedRoot(props: Record<string, unknown>) {
    const bridge = useBridgeRouter();
    const navigation = bridge?.memoryRoute ? undefined : bridge?.navigation;
    const basename = typeof props.basename === 'string' ? props.basename : '/';
    const [instance] = useState(() => {
      const context = getInitialContext(true, { routeAssets: {} });
      const mount = { basename: navigation ? basename : '/', navigation };
      context._routeScope = {
        projectHref: href => {
          const target = mount.navigation
            ? (translateLocation(
                href,
                definition.route || '/',
                mount.basename,
              ) ?? addBasename(href, mount.basename))
            : href;
          return mount.navigation?.createHref?.(target) ?? target;
        },
        config: {
          routes: instanceRoutes(definition),
          globalApp: definition.globalApp,
        },
        initialUrl:
          bridge?.memoryRoute?.entryPath ??
          (navigation
            ? (translateLocation(
                navigation.getLocation(),
                basename,
                definition.route || '/',
              ) ??
              definition.route ??
              '/')
            : definition.route || '/'),
      };
      const runtime = definition.createRuntime(
        context._routeScope.config,
        definition.route !== undefined,
      );
      runtime.pluginAPI!.updateRuntimeContext(context);
      context._internalContext = runtime;
      const WrappedRoot = runtime.hooks.wrapRoot.call(
        definition.App!,
      ) as React.ComponentType<any>;
      return { context, runtime, WrappedRoot, mount };
    });
    instance.mount.basename = navigation ? basename : '/';
    instance.mount.navigation = navigation;
    const [ready, setReady] = useState(false);
    const [failure, setFailure] = useState<unknown>();
    useEffect(() => {
      let active = true;
      Promise.resolve()
        .then(() =>
          instance.runtime.hooks.onBeforeRender.call(instance.context),
        )
        .then(
          () => {
            if (active) setReady(true);
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
        instance.context._routeScope?.router?.dispose();
      };
    }, [instance]);
    if (failure) throw failure;
    if (!ready) return null;
    const { WrappedRoot } = instance;
    return wrapRuntimeContextProvider(
      <ScopedRootPropsContext.Provider value={props}>
        <WrappedRoot {...props} />
        <ScopeNavigation
          context={instance.context}
          basename={basename}
          navigation={navigation}
          selectedRoute={definition.route}
          onError={setFailure}
        />
      </ScopedRootPropsContext.Provider>,
      instance.context,
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

function ScopeNavigation({
  context,
  basename,
  navigation,
  selectedRoute,
  onError,
}: {
  context: ReturnType<typeof getInitialContext>;
  basename: string;
  navigation: NonNullable<ReturnType<typeof useBridgeRouter>>['navigation'];
  selectedRoute?: string;
  onError: (error: unknown) => void;
}) {
  useEffect(() => {
    const router = context._routeScope?.router;
    if (router && navigation)
      return connectRemoteRouter(
        router,
        basename,
        navigation,
        onError,
        selectedRoute,
      );
  }, [context, basename, navigation, onError, selectedRoute]);
  return null;
}
