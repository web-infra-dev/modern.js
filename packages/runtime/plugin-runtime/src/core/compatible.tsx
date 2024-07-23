import React, { useContext, useMemo } from 'react';
import type { Renderer } from 'react-dom';
import type { hydrateRoot, createRoot } from 'react-dom/client';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import {
  RuntimeReactContext,
  RuntimeContext,
  TRuntimeContext,
} from './context/runtime';
import { Plugin, registerPlugin, runtime } from './plugin';
import { createLoaderManager } from './loader/loaderManager';
import { getGlobalRunner } from './plugin/runner';
import { getGlobalAppInit } from './context';
import { hydrateRoot as ModernHydrateRoot } from './browser/hydrate';

const IS_REACT18 = process.env.IS_REACT18 === 'true';

export type CreateAppOptions = {
  plugins: Plugin[];
  /**
   * In the test cases, we need to execute multiple createApp instances simultaneously, and they must not share the runtime.
   */
  runtime?: typeof runtime;
  props?: any;
};

function isClientArgs(
  id: Parameters<BootStrap>[1],
): id is HTMLElement | string {
  return (
    typeof id === 'string' ||
    (typeof HTMLElement !== 'undefined' && id instanceof HTMLElement)
  );
}

type PluginRunner = ReturnType<typeof runtime.init>;

const getInitialContext = (runner: PluginRunner) => ({
  loaderManager: createLoaderManager({}),
  runner,
  isBrowser: true,
  routeManifest:
    typeof window !== 'undefined' && (window as any)[ROUTE_MANIFEST],
});

export const createApp = ({
  plugins,
  runtime,
  props: globalProps,
}: CreateAppOptions) => {
  const runner = registerPlugin(plugins, { plugins: [] }, runtime);

  return (App?: React.ComponentType<any>) => {
    const WrapperComponent: React.ComponentType<any> = props => {
      return React.createElement(
        App || React.Fragment,
        App ? { ...props } : null,
        App
          ? props.children
          : React.Children.map(props.children, child =>
              React.isValidElement(child)
                ? React.cloneElement(child, {
                    ...(child.props as object),
                    ...props,
                  })
                : child,
            ),
      );
    };

    const WrapperApp = runner.wrapRoot(WrapperComponent);
    const WrapComponent = ({ _internal_context, ...props }: any) => {
      let contextValue = _internal_context;

      // We should construct the context, when root component is not passed into `bootstrap`.
      if (!contextValue?.runner) {
        contextValue = getInitialContext(runner);

        runner?.beforeRender(contextValue);
        getGlobalAppInit()?.(contextValue);
      }

      const mergedProps = { ...props, ...globalProps };

      return (
        <RuntimeReactContext.Provider value={contextValue}>
          <WrapperApp {...mergedProps} />
        </RuntimeReactContext.Provider>
      );
    };

    return WrapComponent;
  };
};

type BootStrap<T = unknown> = (
  App: React.ComponentType,
  id: string | HTMLElement | RuntimeContext,
  root?: any,
  ReactDOM?: {
    render?: Renderer;
    hydrate?: Renderer;
    createRoot?: typeof createRoot;
    hydrateRoot?: typeof hydrateRoot;
  },
) => Promise<T>;

export const bootstrap: BootStrap = async (
  BootApp,
  /**
   * When csr, id is root id.
   * When ssr, id is serverContext
   */
  id,
  /**
   * root.render need use root to run function
   */
  root,
  ReactDOM,
) => {
  const App = BootApp;
  const runner = getGlobalRunner();

  const context: RuntimeContext = getInitialContext(runner);

  const runBeforeRender = async (_context: RuntimeContext) => {
    const context = await runner.beforeRender(_context);
    const init = getGlobalAppInit();
    return init?.(context);
  };

  // don't mount the App, let user in charge of it.
  if (!id) {
    return React.createElement(App as React.ComponentType<any>, {
      _internal_context: context,
    });
  }

  const isBrowser = typeof window !== 'undefined' && window.name !== 'nodejs';
  if (isBrowser) {
    if (isClientArgs(id)) {
      const ssrData = window._SSR_DATA;
      const loadersData = ssrData?.data?.loadersData || {};

      const initialLoadersState = Object.keys(loadersData).reduce(
        (res: any, key) => {
          const loaderData = loadersData[key];

          if (loaderData?.loading !== false) {
            return res;
          }

          res[key] = loaderData;
          return res;
        },
        {},
      );

      Object.assign(context, {
        loaderManager: createLoaderManager(initialLoadersState, {
          skipStatic: true,
        }),
        ...(ssrData ? { ssrContext: ssrData?.context } : {}),
      });

      context.initialData = ssrData?.data?.initialData;
      const initialData = await runBeforeRender(context);
      if (initialData) {
        context.initialData = initialData as Record<string, unknown>;
      }

      const rootElement =
        typeof id !== 'string' ? id : document.getElementById(id || 'root')!;

      if (!ReactDOM) {
        throw Error('The `bootstrap` need provide `ReactDOM` parameter');
      }
      // https://react.dev/blog/2022/03/08/react-18-upgrade-guide
      const ModernRender = (App: React.ReactElement) => {
        if (IS_REACT18) {
          if (root) {
            root.render(App);
            return root;
          }
          if (ReactDOM.createRoot) {
            const root = ReactDOM.createRoot(rootElement);
            root.render(App);
            return root;
          } else {
            throw Error(
              'The `bootstrap` `ReactDOM` parameter needs to provide the `createRoot` method',
            );
          }
        } else {
          if (!ReactDOM.render) {
            throw Error(
              'The `bootstrap` `ReactDOM` parameter needs to provide the `render` method',
            );
          }
          ReactDOM.render(App, rootElement);
          return rootElement;
        }
      };

      const ModernHydrate = (
        App: React.ReactElement,
        callback?: () => void,
      ): any => {
        if (IS_REACT18) {
          if (!ReactDOM.hydrateRoot) {
            throw Error(
              'The `bootstrap` `ReactDOM` parameter needs to provide the `hydrateRoot` method',
            );
          }
          ReactDOM.hydrateRoot(rootElement, App);
          return rootElement;
        }
        if (!ReactDOM.hydrate) {
          throw Error(
            'The `bootstrap` `ReactDOM` parameter needs to provide the `hydrate` method',
          );
        }
        ReactDOM.hydrate(App, rootElement, callback);
        return rootElement;
      };

      // we should hydateRoot only when ssr
      if (ssrData) {
        return ModernHydrateRoot(<App />, context, ModernRender, ModernHydrate);
      }
      return ModernRender(
        React.createElement(App, { _internal_context: context } as any),
      );
    } else {
      throw Error(
        '`bootstrap` needs id in browser environment, it needs to be string or element',
      );
    }
  } else {
    throw Error('Bootstrap function not support ssr render');
  }
};

export const useRuntimeContext = () => {
  const context = useContext(RuntimeReactContext);

  const pickedContext: TRuntimeContext = {
    ...context,
    request: context.ssrContext?.request,
    response: context.ssrContext?.response,
  };

  const memoizedContext = useMemo(
    () => context.runner.pickContext(pickedContext),
    [context],
  );

  return memoizedContext;
};
