import { createStore as originCreateStore } from '@modern-js-reduck/store';
import effectsPlugin from '@modern-js-reduck/plugin-effects';
import autoActionsPlugin from '@modern-js-reduck/plugin-auto-actions';
import immerPlugin from '@modern-js-reduck/plugin-immutable';
import { modernjs_config_key } from '@/constant';

export const effects = () => effectsPlugin;
export const immer = () => immerPlugin;
export const autoActions = () => autoActionsPlugin;

export const createStore: typeof originCreateStore = props => {
  const createStatePlugins = () => {
    const modernConfig = (global as any)[modernjs_config_key];
    const stateConfig = modernConfig?.runtime?.state;
    const plugins = [];

    if (stateConfig === true || stateConfig?.effects) {
      plugins.push(effects());
    }

    if (stateConfig === true || stateConfig?.autoActions) {
      plugins.push(autoActions());
    }

    if (stateConfig === true || stateConfig?.immer) {
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
