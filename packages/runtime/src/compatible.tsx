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
      const element = React.createElement(App, { ...props }, props.children);
      const context = useContext(RuntimeReactContext);

      return runner.provide(
        { element, props: { ...props }, context },
        {
          container,
          // eslint-disable-next-line @typescript-eslint/no-shadow
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
        // eslint-disable-next-line @typescript-eslint/no-shadow
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

interface BootStrap {
  (App: React.ComponentType, id?: string): Promise<unknown>;
  (
    App: React.ComponentType,
    serverContext: Record<string, unknown>,
  ): Promise<unknown>;
}

export const bootstrap: BootStrap = async (
  BootApp: React.ComponentType,

  /**
   * When csr, id is root id.
   * When ssr, id is serverContext
   */
  id: string | any,
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

  if (typeof window !== 'undefined') {
    const loadersData = (window as any)?._SSR_DATA?.data?.loadersData || {};

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
    });

    await runInit(context);

    return runner.client(
      {
        App,
        context,
        rootElement:
          typeof id !== 'string' ? id : document.getElementById(id || 'root')!,
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        onLast: async ({ App, rootElement }) => {
          ReactDOM.render(React.createElement(App, { context }), rootElement);
        },
      },
    );
  }

  Object.assign(context, {
    ssrContext: id,
    isBrowser: false,
    loaderManager: createLoaderManager(
      {},
      {
        skipNonStatic: id.staticGenerate,
        // if not static generate, only non-static loader can exec on prod env
        skipStatic: process.env.NODE_ENV === 'production' && !id.staticGenerate,
      },
    ),
  });

  await runInit(context);

  return runner.server({
    App,
    context,
  });
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
