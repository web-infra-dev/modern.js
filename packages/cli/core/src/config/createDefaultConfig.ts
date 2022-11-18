import { CliUserConfig, IAppContext } from '../types';

export function createDefaultConfig(appContext: IAppContext): CliUserConfig {
  const defaultAlias: Record<string, string> = appContext
    ? {
        [appContext.internalDirAlias]: appContext.internalDirectory,
        [appContext.internalSrcAlias]: appContext.srcDirectory,
        '@': appContext.srcDirectory,
        '@shared': appContext.sharedDirectory,
      }
    : {};

  return {
    source: {
      alias: defaultAlias,
    },
  };
}
