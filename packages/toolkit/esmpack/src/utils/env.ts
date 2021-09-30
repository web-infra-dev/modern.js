import { EnvironmentVariables } from '../Options';

export const getRollupReplaceKeys = (
  env: EnvironmentVariables,
): Record<string, string> => {
  const ret = Object.keys(env).reduce((acc, envKey) => {
    const envVar = env[envKey];
    acc[`process.env.${envKey}`] =
      envVar === true ? process.env[envKey]! : JSON.stringify(envVar);
    return acc;
  }, {} as Record<string, string>);
  return ret;
};
