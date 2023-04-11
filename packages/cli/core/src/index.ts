import { createCli } from './createCli';

export * from './types';
export * from '@modern-js/plugin';
export { mergeConfig, initAppDir } from './utils';
export { manager, createPlugin, registerHook } from './manager';
export {
  AppContext,
  ConfigContext,
  ResolvedConfigContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
  initAppContext,
} from './context';

export const cli = createCli();

declare module '@modern-js/utils/compiled/commander' {
  export interface Command {
    commandsMap: Map<string, Command>;
  }
}
