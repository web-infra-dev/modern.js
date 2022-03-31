import { createStore as originCreateStore } from '@modern-js-reduck/store';
import effectsPlugin from '@modern-js-reduck/plugin-effects';
import autoActionsPlugin from '@modern-js-reduck/plugin-auto-actions';
import immerPlugin from '@modern-js-reduck/plugin-immutable';
import { MODERNJS_CONFIG_KEY } from '../constant';

export const effects = () => effectsPlugin;
export const immer = () => immerPlugin;
export const autoActions = () => autoActionsPlugin;

export const createStore: typeof originCreateStore = props => {
  const createStatePlugins = () => {
    const modernConfig = (global as any)[MODERNJS_CONFIG_KEY];
    const stateConfig = modernConfig?.runtime?.state;
    const plugins = [];

    if (stateConfig?.effects !== false) {
      plugins.push(effects());
    }

    if (stateConfig?.autoActions !== false) {
      plugins.push(autoActions());
    }

    if (stateConfig?.immer !== false) {
      plugins.push(immer());
    }

    return (props?.plugins || []).concat(plugins);
  };

  const config = {
    ...(props || {}),
    plugins: createStatePlugins(),
  };

  return originCreateStore(config);
};
