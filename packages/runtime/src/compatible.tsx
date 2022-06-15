import React, { useContext, useMemo } from 'react';
import ReactDOM from 'react-dom';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { createContainer } from '@modern-js/plugin';
import { Plugin, runtime, AppComponentContext } from './plugin';
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

const runnerMap = new WeakMap<
  React.ComponentType<any>,
  ReturnType<typeof runtime.init>
>();

export const createApp = ({ plugins }: CreateAppOptions) => {
  const appRuntime = runtime.clone();
  appRuntime.usePlugin(...plugins);

  return (App: React.ComponentType<any>) => {
    const runner = appRuntime.init({});

    const container = createContainer({ App: AppComponentContext.create(App) });

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
          container,
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
        container,
        onLast: ({ App }: any) => {
          const WrapComponent = ({ context, ...props }: any) => {
            let contextValue = context;

            if (!contextValue) {
              contextValue = {
                loaderManager: createLoaderManager({}),
                runner,
              };

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

type BootStrap<T = unknown> = (
  App: React.ComponentType,
  id?: string | Record<string, any> | HTMLElement,
) => Promise<T>;

export const bootstrap: BootStrap = async (
  BootApp,
  /**
   * When csr, id is root id.
   * When ssr, id is serverContext
   */
  id,
) => {
  let App = BootApp;
  let runner = runnerMap.get(App);

  // ensure Component used is created by `createApp`
  if (!runner) {
    App = createApp({ plugins: [] })(App);
    runner = runnerMap.get(App)!;
  }

  const context: any = {
    loaderManager: createLoaderManager({}),
    runner,
    isBrowser: true,
  };

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

  if (typeof window !== 'undefined') {
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

      await runInit(context);

      return runner.client(
        {
          App,
          context,
          rootElement:
            typeof id !== 'string'
              ? id
              : document.getElementById(id || 'root')!,
        },
        {
          onLast: async ({ App, rootElement }) => {
            ReactDOM.render(React.createElement(App, { context }), rootElement);
          },
        },
      );
    } else {
      throw Error(
        '`bootstrap` should run in browser environment when the second param is not the serverContext',
      );
    }
    // } else if (typeof id === 'object' && !(id instanceof HTMLElement)) {
  } else if (!isClientArgs(id)) {
    Object.assign(context, {
      ssrContext: id,
      isBrowser: false,
      loaderManager: createLoaderManager(
        {},
        {
          skipNonStatic: id.staticGenerate,
          // if not static generate, only non-static loader can exec on prod env
          skipStatic:
            process.env.NODE_ENV === 'production' && !id.staticGenerate,
        },
      ),
    });

    await runInit(context);

    return runner.server({
      App,
      context,
    });
  } else {
    throw Error(
      '`bootstrap` should run in browser environment when the second param is not the serverContext',
    );
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
