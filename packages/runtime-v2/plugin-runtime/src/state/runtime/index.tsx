import {
  createStore,
  type Model,
  type StoreConfig,
} from '@modern-js-reduck/store';
import { Provider } from '@modern-js-reduck/react';
import { Plugin } from '../../core/plugin';
import { immer, effects, autoActions, devtools } from './plugins';

export * from '@modern-js-reduck/react';

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

export const statePlugin = (config: StateConfig): Plugin => {
  return {
    name: '@modern-js/plugin-state',
    setup: () => {
      const storeConfig = getStoreConfig(config);
      return {
        hoc({ App, config }, next) {
          const getStateApp = (props: any) => {
            const store = createStore(storeConfig);
            return (
              <Provider store={store} config={storeConfig}>
                <App {...props} />
              </Provider>
            );
          };
          return next({
            App: getStateApp,
            config,
          });
        },
      };
    },
  };
};

export default statePlugin;
