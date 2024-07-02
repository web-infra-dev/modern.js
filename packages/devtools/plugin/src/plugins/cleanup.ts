import { Plugin } from '../types';

export const pluginCleanup: Plugin = {
  name: 'cleanup',
  async setup(api) {
    let _done = false;
    const cleanup = async () => {
      !_done && (await api.hooks.callHook('cleanup'));
      _done = true;
    };
    api.frameworkHooks.hook('beforeExit', cleanup);
    api.frameworkHooks.hook('beforeRestart', cleanup);
    api.frameworkHooks.hook('afterBuild', cleanup);
  },
};
