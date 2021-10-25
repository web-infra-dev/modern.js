// eslint-disable-next-line filenames/match-exported
import { useContext } from 'react';
import { createPlugin, RuntimeReactContext } from '@modern-js/runtime-core';
import { createStore, Store } from '@modern-js-reduck/store';
import { Provider } from '@modern-js-reduck/react';

declare module '@modern-js/runtime-core' {
  interface RuntimeContext {
    store: Store;
  }

  interface TRuntimeContext {
    store: Store;
  }
}

declare global {
  interface Window {
    _SSR_DATA?: {
      data: {
        storeState: any;
      };
    };
  }
}

type PluginProps = Parameters<typeof createStore>[0];

const state = (config: PluginProps) =>
  createPlugin(
    () => ({
      hoc({ App }, next) {
        return next({
          App: (props: any) => {
            const context = useContext(RuntimeReactContext);

            return (
              <Provider store={context.store} config={config}>
                <App {...props} />
              </Provider>
            );
          },
        });
      },
      init({ context }, next) {
        const storeConfig = config || {};

        if (typeof window !== 'undefined') {
          storeConfig.initialState =
            storeConfig.initialState ||
            window?._SSR_DATA?.data?.storeState ||
            {};
        }

        context.store = createStore(storeConfig);

        next({ context });
      },
      pickContext({ context, pickedContext }, next) {
        return next({
          context,
          pickedContext: {
            ...pickedContext,
            store: context.store,
          },
        });
      },
    }),
    {
      name: '@modern-js/plugin-state',
    },
  );

export default state;

export * from '../plugins';
