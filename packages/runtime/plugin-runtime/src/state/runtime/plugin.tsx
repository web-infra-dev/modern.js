import { useContext } from 'react';
import {
  createStore,
  type Model,
  type StoreConfig,
} from '@modern-js-reduck/store';
import { Provider } from '@modern-js-reduck/react';
import { merge } from '@modern-js/runtime-utils/merge';
import { immer, effects, autoActions, devtools } from '../plugins';
import { RuntimeReactContext } from '../../core';
import type { Plugin } from '../../core';
import { isBrowser } from '../../common';

type StatePluginType = 'immer' | 'effects' | 'autoActions' | 'devtools';
type StateExtraType = {
  initialState: any;
  models: Array<Model>;
};

export type StateConfig = Partial<
  Record<StatePluginType, boolean> & StateExtraType
>;

const StatePluginHandleMap: Record<StatePluginType, any> = {
  immer,
  effects,
  autoActions,
  devtools,
};

const getStoreConfig = (config: StateConfig): StoreConfig => {
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

  const storeConfig: StoreConfig = {};

  for (const [key, value] of Object.entries(config)) {
    if (!internalPlugins.includes(key as StatePluginType)) {
      storeConfig[key as keyof StoreConfig] = value;
    }
  }

  storeConfig.plugins = plugins;

  return storeConfig;
};

export const statePlugin = (originConfig: StateConfig): Plugin => ({
  name: '@modern-js/plugin-state',
  setup: api => {
    let storeConfig: StoreConfig;
    return {
      wrapRoot(App) {
        const getStateApp = (props: any) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const context = useContext(RuntimeReactContext);

          return (
            <Provider store={context.store} config={storeConfig}>
              <App {...props} />
            </Provider>
          );
        };
        return getStateApp;
      },
      beforeRender(context) {
        const userConfig = api.useRuntimeConfigContext();
        const config = merge(originConfig, userConfig);
        storeConfig = getStoreConfig(config);
        if (isBrowser()) {
          storeConfig.initialState =
            storeConfig.initialState ||
            window?._SSR_DATA?.data?.storeState ||
            {};
        }

        context.store = createStore(storeConfig);
      },
    };
  },
});

export default statePlugin;

export * from '../plugins';
