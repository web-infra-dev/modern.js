import React, { useContext, useMemo } from 'react';
import defaultReactDOM from 'react-dom';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { Plugin, runtime } from './plugin';
import {
  RuntimeReactContext,
  RuntimeContext,
  TRuntimeContext,
} from './runtime-context';
import { createLoaderManager } from './loader/loaderManager';

export type CreateAppOptions = {
  plugins: Plugin[];
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

const runnerMap = new WeakMap<React.ComponentType<any>, PluginRunner>();

export const isReact18 = React.version.startsWith('18.');

const getInitialContext = (runner: PluginRunner) => ({
  loaderManager: createLoaderManager({}),
  runner,
  isBrowser: true,
  isReact18,
});

export const createApp = ({ plugins }: CreateAppOptions) => {
  const appRuntime = runtime.clone();
  appRuntime.usePlugin(...plugins);

  return (App?: React.ComponentType<any>) => {
    const runner = appRuntime.init();

    const WrapperComponent: React.ComponentType<any> = props => {
      const element = React.createElement(
        App || React.Fragment,
        { ...props },
        props.children,
      );
      const context = useContext(RuntimeReactContext);

      return runner.provide(
        { element, props: { ...props }, context },
        {
          onLast: ({ element }) => element,
        },
      );
    };

    if (App) {
      hoistNonReactStatics(WrapperComponent, App);
    }

    const HOCApp = runner.hoc(
      { App: WrapperComponent },
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
            return (
              <RuntimeReactContext.Provider value={contextValue}>
                <App {...props} />
              </RuntimeReactContext.Provider>
            );
          };

          return hoistNonReactStatics(WrapComponent, App);
        },
      },
    );

    runnerMap.set(HOCApp, runner);

    return HOCApp;
  };
};

interface HydrateFunc {
  // React 18
  (container: Element | Document, initialChildren: React.ReactNode): void;
  // React 17
  (
    initialChildren: React.ReactNode,
    container: Element | Document,
    callback?: () => void,
  ): void;
}

type BootStrap<T = unknown> = (
  App: React.ComponentType,
  id?: string | Record<string, any> | HTMLElement,
  render?: (children: React.ReactNode, rootElement?: HTMLElement) => void,
  hydrate?: HydrateFunc,
) => Promise<T>;

export const bootstrap: BootStrap = async (
  BootApp,
  id,
  render = defaultReactDOM.render as any,
  hydrate = defaultReactDOM.hydrate as any,
  /**
   * When csr, id is root id.
   * When ssr, id is serverContext
   */
) => {
  let App = BootApp;
  let runner = runnerMap.get(App);

  // ensure Component used is created by `createApp`
  if (!runner) {
    App = createApp({ plugins: [] })(App);
    runner = runnerMap.get(App)!;
  }

  const context: any = getInitialContext(runner);

  const runInit = (_context: RuntimeContext) =>
    runner!.init(
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

      const ModernRender = (App: React.ReactNode) => {
        if (isReact18) {
          render(App);
        } else {
          render(App, rootElement);
        }
      };

      const ModernHydrate = (App: React.ReactNode, callback?: () => void) => {
        if (isReact18) {
          hydrate(rootElement, App);
        } else {
          hydrate(App, rootElement, callback);
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

    const initialData = await runInit(context);
    context.initialData = initialData;

    return runner.server({
      App,
      context,
    });
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
