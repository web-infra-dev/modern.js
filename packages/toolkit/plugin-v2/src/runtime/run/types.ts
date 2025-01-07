import type { Plugin } from '../../types/plugin';

export type RuntimeRunOptions = {
  plugins: Plugin[];
  handleSetupResult?: (
    params: any,
    api: Record<string, any>,
  ) => Promise<void> | void;
  config: Record<string, any>;
};
