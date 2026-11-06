import type { Plugin } from '../../types/plugin';

export type RuntimeRunOptions = {
  config: Record<string, any>;
  /** The canonical mutable context for one mount or server request. */
  runtimeContext?: Record<string, any>;
  plugins: Plugin[];
  handleSetupResult?: (
    params: any,
    api: Record<string, any>,
  ) => Promise<void> | void;
};
