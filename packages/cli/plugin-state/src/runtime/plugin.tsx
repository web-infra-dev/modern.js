// eslint-disable-next-line filenames/match-exported
import { useContext } from 'react';
import { createPlugin, RuntimeReactContext } from '@modern-js/runtime-core';
import { createStore, Store } from '@modern-js-reduck/store';
import { Provider } from '@modern-js-reduck/react';
import hoistNonReactStatics from 'hoist-non-react-statics';

declare module '@modern-js/runtime-core' {
  interface RuntimeContext {
    store: Store;
  }

  interface TRuntimeContext {
    store: Store;
  }

  interface SSRData {
    storeState: any;
  }
}

type PluginProps = Parameters<typeof createStore>[0];

const state = (config: PluginProps) =>
  createPlugin(
    () => ({
      hoc({ App }, next) {
        const getStateApp = (props: any) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const context = useContext(RuntimeReactContext);

          return (
            <Provider store={context.store} config={config}>
              <App {...props} />
            </Provider>
          );
        };
        return next({
          App: hoistNonReactStatics(getStateApp, App),
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
