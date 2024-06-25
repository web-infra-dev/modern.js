import React, { useContext, useMemo } from 'react';
import type { Renderer } from 'react-dom';
import type { hydrateRoot, createRoot } from 'react-dom/client';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import {
  RuntimeReactContext,
  RuntimeContext,
  TRuntimeContext,
} from './context/runtime';
import { Plugin, registerPlugin, runtime } from './plugin';
import { createLoaderManager } from './loader/loaderManager';
import { getGlobalRunner } from './plugin/runner';

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

    if (App) {
      hoistNonReactStatics(WrapperComponent, App);
    }

    const HOCApp = runner.hoc(
      { App: WrapperComponent, config: globalProps || {} },
      {
        onLast: ({ App }: any) => {
          const WrapComponent = ({ context, ...props }: any) => {
            let contextValue = context;

            // We should construct the context, when root component is not passed into `bootstrap`.
            if (!contextValue?.runner) {
              contextValue = getInitialContext(runner);

              runner.init(
                { context: contextValue },
                {
                  onLast: ({ context: context1 }) => App?.init?.(context1),
                },
              );
            }

            const mergedProps = { ...props, ...globalProps };

            return (
              <RuntimeReactContext.Provider value={contextValue}>
                <App {...mergedProps} />
              </RuntimeReactContext.Provider>
            );
          };

          return hoistNonReactStatics(WrapComponent, App);
        },
      },
    );

    return HOCApp;
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
  // eslint-disable-next-line consistent-return
) => {
  const App = BootApp;
  const runner = getGlobalRunner();

  const context: RuntimeContext = getInitialContext(runner);

  const runInit = (_context: RuntimeContext) =>
    runner.init(
      { context: _context },
      {
        onLast: ({ context: context1 }) => (App as any)?.init?.(context1),
      },
    );

  // don't mount the App, let user in charge of it.
  if (!id) {
    return React.createElement(App as React.ComponentType<any>, {
      context,
    });
  }

  const isBrowser = typeof window !== 'undefined' && window.name !== 'nodejs';
  if (isBrowser) {
    if (isClientArgs(id)) {
      const ssrData = (window as any)._SSR_DATA;
      const loadersData = ssrData?.data?.loadersData || {};

      const initialLoadersState = Object.keys(loadersData).reduce(
        (res: any, key) => {
          const loaderData = loadersData[key];

          if (loaderData.loading !== false) {
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
      const initialData = await runInit(context);
      if (initialData) {
        context.initialData = initialData;
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
          } else if (ReactDOM.createRoot) {
            ReactDOM.createRoot(rootElement).render(App);
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
        }
      };

      const ModernHydrate = (
        App: React.ReactElement,
        callback?: () => void,
      ) => {
        if (IS_REACT18) {
          if (!ReactDOM.hydrateRoot) {
            throw Error(
              'The `bootstrap` `ReactDOM` parameter needs to provide the `hydrateRoot` method',
            );
          }
          ReactDOM.hydrateRoot(rootElement, App);
        } else {
          if (!ReactDOM.hydrate) {
            throw Error(
              'The `bootstrap` `ReactDOM` parameter needs to provide the `hydrate` method',
            );
          }
          ReactDOM.hydrate(App, rootElement, callback);
        }
      };

      return runner.client(
        {
          App,
          context,
          ModernRender,
          ModernHydrate,
        },
        {
          onLast: ({ App }) => {
            ModernRender(React.createElement(App, { context }));
          },
        },
      );
    } else {
      throw Error(
        '`bootstrap` needs id in browser environment, it needs to be string or element',
      );
    }
  } else {
    Object.assign(context, {
      ssrContext: id,
      isBrowser: false,
      loaderManager: createLoaderManager(
        {},
        {
          skipNonStatic: (id as Record<string, any>).staticGenerate,
          // if not static generate, only non-static loader can exec on prod env
          skipStatic:
            process.env.NODE_ENV === 'production' &&
            !(id as Record<string, any>).staticGenerate,
        },
      ),
    });

    // Handle redirects from React Router with an HTTP redirect
    const isRedirectResponse = (result: any) => {
      if (
        typeof Response !== 'undefined' && // fix: ssg workflow doesn't inject Web Response
        result instanceof Response &&
        result.status >= 300 &&
        result.status <= 399
      ) {
        const { status } = result;
        const redirectUrl = result.headers.get('Location') || '/';
        const { ssrContext } = context;
        if (ssrContext) {
          ssrContext.res && (ssrContext.res.statusCode = status);
          ssrContext.res?.setHeader('Location', redirectUrl);
          ssrContext.redirection = ssrContext.redirection || {};
          ssrContext.redirection.status = status;
          ssrContext.redirection.url = redirectUrl;
        }
        return true;
      }
      return false;
    };

    const initialData = await runInit(context);
    if (!isRedirectResponse(initialData)) {
      context.initialData = initialData;
      // Support data loader to return status code
      if (
        context.routerContext?.statusCode &&
        context.routerContext?.statusCode !== 200
      ) {
        context.ssrContext?.response.status(context.routerContext?.statusCode);
      }
      return runner.server({
        App,
        context,
      });
    }
  }
};

export const useRuntimeContext = () => {
  const context = useContext(RuntimeReactContext);

  const memoizedContext = useMemo(
    () =>
      context.runner.pickContext(
        { context, pickedContext: {} as any },
        {
          onLast: ({ pickedContext }: { pickedContext: TRuntimeContext }) =>
            pickedContext,
        },
      ),
    [context],
  );

  return memoizedContext;
};
