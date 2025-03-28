import { Provider } from '@modern-js-reduck/react';
import {
  type Model,
  type StoreConfig,
  createStore,
} from '@modern-js-reduck/store';
import type { Plugin } from '@modern-js/runtime';
import { RuntimeReactContext, isBrowser } from '@modern-js/runtime';
import { merge } from '@modern-js/runtime-utils/merge';
import { useContext } from 'react';
import { autoActions, devtools, effects, immer } from '../plugins';

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

export const statePlugin = (userConfig: StateConfig = {}): Plugin => ({
  name: '@modern-js/plugin-state',
  setup: api => {
    let storeConfig: StoreConfig;
    return {
      wrapRoot(App) {
        const getStateApp = (props: any) => {
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
        const pluginConfig: Record<string, any> = api.useRuntimeConfigContext();
        const config = merge(pluginConfig.state || {}, userConfig);
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
