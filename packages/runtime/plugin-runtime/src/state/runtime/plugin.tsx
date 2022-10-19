import { useContext } from 'react';
import { createStore } from '@modern-js-reduck/store';
import { Provider } from '@modern-js-reduck/react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { immer, effects, autoActions, devtools } from '../plugins';
import { RuntimeReactContext } from '../../core';
import type { Plugin } from '../../core';
import { isBrowser } from '../../common';

export type StatePluginType = 'immer' | 'effects' | 'autoActions' | 'devtools';

export type StateConfig = Record<Partial<StatePluginType>, boolean>;

const StatePluginHandleMap: Record<StatePluginType, any> = {
  immer,
  effects,
  autoActions,
  devtools,
};

const getStoreConfig = (
  config: StateConfig,
): NonNullable<Parameters<typeof createStore>[0]> => {
  const internalPlugins: StatePluginType[] = [
    'immer',
    'effects',
    'autoActions',
    'devtools',
  ];
  const plugins: any[] = [];
  internalPlugins
    .filter(plugin => config[plugin] !== false)
    .forEach(plugin =>
      plugins.push(StatePluginHandleMap[plugin](config[plugin])),
    );
  return { plugins };
};

const state = (config: StateConfig): Plugin => ({
  name: '@modern-js/plugin-state',
  setup: () => {
    return {
      hoc({ App }, next) {
        const getStateApp = (props: any) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const context = useContext(RuntimeReactContext);

          return (
            <Provider store={context.store} config={getStoreConfig(config)}>
              <App {...props} />
            </Provider>
          );
        };
        return next({
          App: hoistNonReactStatics(getStateApp, App),
        });
      },
      init({ context }, next) {
        const storeConfig = getStoreConfig(config || {});

        if (isBrowser()) {
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
    };
  },
});

export default state;

export * from '../plugins';
