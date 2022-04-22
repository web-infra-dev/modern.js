import type { IAppContext, UserConfig } from '@modern-js/core';
import {
  isProdProfile,
  isTypescript,
  readTsConfig,
  chalk,
} from '@modern-js/utils';

export const verifyTsConfigPaths = (root: string, userConfig: UserConfig) => {
  const userAliases = userConfig.source?.alias;

  if (!userAliases) {
    return;
  }

  const paths = Object.keys(
    readTsConfig(root).compilerOptions?.paths || {},
  ).map(key => key.replace(/\/\*$/, ''));

  Object.keys(userAliases).forEach(name => {
    if (paths.includes(name)) {
      throw new Error(
        chalk.red(
          `It looks like you have configured the alias ${chalk.bold(
            name,
          )} in both the modern.config file and tsconfig.json.\n Please remove the configuration in modern.config file and just keep the configuration in tsconfig.json.`,
        ),
      );
    }
  });
};

export const getWebpackAliases = (
  appContext: IAppContext,
  userConfig: UserConfig,
) => {
  if (isTypescript(appContext.appDirectory)) {
    verifyTsConfigPaths(appContext.appDirectory, userConfig);
  }

  return {
    [appContext.internalDirAlias]: appContext.internalDirectory,
    [appContext.internalSrcAlias]: appContext.srcDirectory,
    '@': appContext.srcDirectory,
    '@shared': appContext.sharedDirectory,
    'react-native': 'react-native-web',
    ...(isProdProfile() && {
      'react-dom$': 'react-dom/profiling',
      'scheduler/tracing': 'scheduler/tracing-profiling',
    }),
  };
};
