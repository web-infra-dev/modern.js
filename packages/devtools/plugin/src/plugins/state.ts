import {
  createServerExportedState,
  ServerExportedState,
  ServerExportedStateResolvers,
} from '@modern-js/devtools-kit/node';
import { proxy } from 'valtio';
import { Plugin } from '../types';

declare global {
  interface DevtoolsPluginVars {
    state: ServerExportedState;
    resolver: ServerExportedStateResolvers;
  }
}

export const pluginState: Plugin = {
  async setup(api) {
    const $serverExportedState = createServerExportedState();
    api.vars.state = proxy($serverExportedState.state);
    api.vars.resolver = $serverExportedState.resolvers;
  },
};
