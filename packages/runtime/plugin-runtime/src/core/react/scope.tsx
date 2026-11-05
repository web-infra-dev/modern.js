import { createBrowserRequestContext } from '../browser/data';
import { useBridgeRouter } from '@module-federation/bridge-react/base';
import {
  createBrowserRouterConnector,
  createMountWindow,
  normalizeBasename,
} from '../../mf/navigation';
import React, { useContext, useEffect, useState } from 'react';
import { createRoot as createReactRoot, type Root } from 'react-dom/client';
import { disposeResources } from '../application/cleanup';
import { wrapRuntimeContextProvider } from './wrapper';

export type { ScopedRootDefinition } from './scopeDefinition';
export { getScopedRootDefinition } from './scopeDefinition';
import {
  type ScopedRootDefinition,
  createScopeRuntime,
  registerScopedRoot,
  PreparedScopeContext,
  PreparedScopedRoot,
  ScopedRootPropsContext,
} from './scopeDefinition';

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
      const memory = Boolean(bridge?.memoryRoute);
      const url = new URL(
        bridge?.memoryRoute?.entryPath || window.location.href,
        window.location.href,
      );
      const instance = createScopeRuntime(definition, {
        isBrowser: true,
        basename: memory ? '/' : basename,
        initialUrl: `${url.pathname}${url.search}${url.hash}`,
        context: {
          ssrContext: createBrowserRequestContext(url, undefined, 'stream'),
        },
        memory,
      });
      const { context } = instance;
      const mountWindow = memory
        ? undefined
        : createMountWindow(
            () => context.application?.router,
            () => context.application?.hash === true,
          );
      context.application!.getWindow = mountWindow
        ? () => mountWindow.window
        : undefined;
      return {
        context,
        get WrappedRoot() {
          return instance.Root;
        },
        prepare: instance.prepare,
        dispose: instance.dispose,
        notifyPeers: mountWindow?.notifyPeers,
        effects: 0,
        initialization: undefined as Promise<unknown> | undefined,
        connection: undefined as
          ReturnType<typeof createBrowserRouterConnector> | undefined,
      };
    });
    const [ready, setReady] = useState(0);
    const [failure, setFailure] = useState<unknown>();
    useEffect(() => {
      let active = true;
      const effect = ++instance.effects;
      const scope = instance.context.application!;
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
            return (instance.initialization ??= instance
              .prepare()
              .then(result => {
                if (result.interrupted) throw result.value;
              }));
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
        const router = scope.router;
        instance.connection = undefined;
        scope.onRouterCreated = undefined;
        scope.router = undefined;
        scope.routes = undefined;
        try {
          disposeResources(
            () => connection?.dispose(),
            () => router?.dispose(),
          );
        } catch (error) {
          // This owner has unmounted. Report cleanup errors without updating
          // its React state or preventing the remaining runtime cleanup.
          console.error(error);
        }
        queueMicrotask(() => {
          if (instance.effects !== effect) return;
          try {
            instance.dispose();
          } catch (error) {
            console.error(error);
          }
        });
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
  const ModernScopedRoot = function ModernScopedRoot(
    props: Record<string, unknown>,
  ) {
    const bridge = useBridgeRouter();
    const prepared = useContext(PreparedScopeContext);
    useEffect(() => {
      if (prepared?.definition === definition && bridge)
        prepared.setNavigation?.(
          bridge?.memoryRoute ? undefined : bridge?.navigation,
        );
    }, [prepared, bridge?.memoryRoute, bridge?.navigation]);
    if (prepared?.definition === definition)
      return <PreparedScopedRoot instance={prepared} props={props} />;
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
  return registerScopedRoot(ModernScopedRoot, definition);
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
