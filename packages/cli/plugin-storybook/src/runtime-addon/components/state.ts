import {
  immer,
  effects,
  autoActions,
  devtools,
} from '@modern-js/runtime/model';

const createStatePlugins = (config: boolean | Record<string, any>) => {
  const plugins = [];

  if (typeof config === 'boolean') {
    plugins.push(immer());

    plugins.push(effects());

    plugins.push(autoActions());

    plugins.push(devtools());
  } else {
    plugins.push(immer(config.immer));

    plugins.push(effects(config.effects));

    plugins.push(autoActions(config.autoActions));

    plugins.push(devtools(config.devtools));
  }

  return plugins;
};

const statePluginsName = ['effects', 'immer', 'autoActions', 'devtools'];

export const getStateOption = (state: true | Record<string, any>) => {
  if (typeof state === 'boolean') {
    return { plugins: createStatePlugins(true) };
  } else {
    // Get the configuration of the state plug-in on top of the object
    const keys = Object.keys(state);
    const statePluginsObj = keys
      .filter(key => statePluginsName.includes(key))
      .reduce<Record<string, any>>((o, key) => {
        o[key] = state[key];
        return o;
      }, {});
    return {
      ...statePluginsObj,
      plugins: createStatePlugins(state),
    };
  }
};
