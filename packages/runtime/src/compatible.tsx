import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
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

      return runner.provide(
        { element, props: { ...props }, context: {} as any },
        {
          container,
          // eslint-disable-next-line @typescript-eslint/no-shadow
          onLast: ({ element }) => element,
        },
      );
    };

    Object.assign(WrapperComponent, App);

    const HOCApp = runner.hoc(
      { App: WrapperComponent },
      {
        container,
        // eslint-disable-next-line @typescript-eslint/no-shadow
        onLast: ({ App }) => {
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
                  onLast: ({ context: context1 }) => {
                    (App as any)?.init?.(context1);
                  },
                },
              );
            }
            return (
              <RuntimeReactContext.Provider value={contextValue}>
                <App {...props} />
              </RuntimeReactContext.Provider>
            );
          };

          return Object.assign(WrapComponent, WrapperComponent);
        },
      },
    );

    runnerMap.set(HOCApp, runner);

    return HOCApp;
  };
};

interface BootStrap {
  (App: React.ComponentType, id?: string): void;
  (App: React.ComponentType, serverContext: Record<string, unknown>): void;
}

export const bootstrap: BootStrap = async (
  App: React.ComponentType,

  /**
   * When csr, id is root id.
   * When ssr, id is serverContext
   */
  id: string | any,
) => {
  const runner = runnerMap.get(App)!;

  const context = {
    loaderManager: createLoaderManager({}),
    runner,
  };

  const runInit = (_context: RuntimeContext) =>
    runner.init(
      { context: _context },
      {
        onLast: ({ context: context1 }) => {
          (App as any)?.init?.(context1);
        },
      },
    );

  if (typeof window !== 'undefined') {
    const loadersData = (window as any)?._SSR_DATA?.data?.loadersData || {};

    const initialLoadersState = Object.keys(loadersData).reduce(
      (res: any, key) => {
        const loaderData = loadersData[key];

        if (
          loaderData.loading !== false ||
          loaderData.error ||
          !loaderData.data
        ) {
          return res;
        }

        res[key] = loaderData.data;
        return res;
      },
      {},
    );

    Object.assign(context, {
      loaderManager: createLoaderManager(initialLoadersState, {
        skipStatic: true,
      }),
    });

    runInit(context);

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
    loaderManager: createLoaderManager(
      {},
      {
        skipNonStatic: id.staticGenerate,
        // if not static generate, only non-static loader can exec on prod env
        skipStatic: process.env.NODE_ENV === 'production' && !id.staticGenerate,
      },
    ),
  });

  runInit(context);

  return runner.server({
    App,
    context,
  });
};

export const useRuntimeContext = () => {
  const context = useContext(RuntimeReactContext);

  return context.runner.pickContext(
    { context, pickedContext: {} },
    {
      onLast: ({ pickedContext }: { pickedContext: TRuntimeContext }) =>
        pickedContext,
    },
  );
};
