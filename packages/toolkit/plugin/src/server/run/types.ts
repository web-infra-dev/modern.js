import type { ServerRoute } from '@modern-js/types';
import type { Plugin } from '../../types/plugin';

export type ServerCreateOptions = {
  /** server working directory, and then also dist directory */
  pwd: string;
  metaName?: string;
  routes?: ServerRoute[];
  appContext: {
    internalDirectory?: string;
    appDirectory?: string;
    sharedDirectory?: string;
    apiDirectory?: string;
    lambdaDirectory?: string;
    bffRuntimeFramework?: string;
    appDependencies?: Record<string, Promise<any>>;
  };
};

export type ServerRunOptions = {
  options: ServerCreateOptions;
  config: Record<string, any>;
  plugins: Plugin[];
  handleSetupResult?: (
    params: any,
    api: Record<string, any>,
  ) => Promise<void> | void;
};
