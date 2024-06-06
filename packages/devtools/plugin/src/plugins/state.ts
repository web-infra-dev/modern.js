import { ServerState } from '@modern-js/devtools-kit/node';
import { proxy } from 'valtio';
import { Plugin } from '../types';

declare global {
  interface DevtoolsPluginVars {
    state: ServerState;
  }
}

export const pluginState: Plugin = {
  async setup(api) {
    api.vars.state = proxy<ServerState>({
      framework: { config: {} },
      builder: { config: {} },
      bundler: { configs: {} },
      context: api.context,
      dependencies: {},
      fileSystemRoutes: {},
    });
  },
};
