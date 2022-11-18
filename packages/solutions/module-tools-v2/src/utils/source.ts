import type {
  AliasOption,
  ModuleToolsHooks,
  PluginAPI,
  UserConfig,
  SourceConfig,
  ModuleContext,
} from '../types';

export const resolveAlias = async (
  context: ModuleContext,
  userAlias?: AliasOption,
) => {
  const { applyOptionsChain } = await import('@modern-js/utils');
  const defaultAlias: Record<string, string> = context.isTsProject
    ? {}
    : {
        '@': 'src',
      };

  if (!userAlias) {
    return defaultAlias;
  }

  return applyOptionsChain<Record<string, string>, undefined>(
    defaultAlias,
    userAlias,
  );
};

export const resolveEnvVars = (userEnvVars?: string[]) => {
  const defaultEnvVars: string[] = [];
  return [...defaultEnvVars, ...(userEnvVars ?? [])];
};

export const resolveGlobalVars = (userGlobalVars?: Record<string, string>) => {
  const defaultGlobalVars = {};
  return {
    ...defaultGlobalVars,
    ...(userGlobalVars ?? {}),
  };
};

export const getSourceConfig = async (
  api: PluginAPI<ModuleToolsHooks>,
  context: ModuleContext,
): Promise<SourceConfig> => {
  const config = api.useResolvedConfigContext() as unknown as UserConfig;
  const alias = await resolveAlias(context, config.source?.alias);
  const envVars = resolveEnvVars(config.source?.envVars);
  const globalVars = resolveGlobalVars(config.source?.globalVars);
  const designSystem = {};

  return { alias, envVars, globalVars, designSystem };
};
