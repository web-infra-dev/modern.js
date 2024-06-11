import type { CliPlugin, IAppContext } from '@modern-js/core';
import { isApiOnly } from '@modern-js/utils';
import { ServerPlugin } from '@modern-js/prod-server';
import { UserConfig } from '../../base/config';
import {
  TestConfigOperator,
  getModuleNameMapper,
  DEFAULT_RESOLVER_PATH,
} from '../../base';
import type { Hooks } from '../../base/hook';
import { bff_info_key } from './constant';
import { isBFFProject } from './utils';

export const setJestConfigForBFF = async ({
  pwd,
  userConfig,
  plugins,
  routes,
  utils,
  appContext,
}: {
  pwd: string;
  userConfig: any;
  plugins: ServerPlugin[];
  routes: any[];
  utils: TestConfigOperator;
  appContext: IAppContext;
}) => {
  const bffConfig = {
    rootDir: appContext.apiDirectory,
    setupFilesAfterEnv: [require.resolve('./setup')],
    testEnvironment: 'node',
    testMatch: [`**/api/**/*.test.[jt]s`],
    modulePathIgnorePatterns: ['config.test.ts'],
    globals: {
      [bff_info_key]: {
        appDir: pwd,
        modernUserConfig: userConfig,
        plugins,
        routes,
        appContext,
      },
    },
  };

  const { jestConfig } = utils;
  const alias = userConfig?.source?.alias || {};

  const aliasMapper = getModuleNameMapper(alias);

  const { moduleNameMapper } = jestConfig;

  // 服务端统一使用 ts-jest
  const transform = {
    '\\.[jt]sx?$': [
      require.resolve('ts-jest'),
      {
        diagnostics: {
          warnOnly: true,
        },
      },
    ],
  };

  const apiOnly = await isApiOnly(pwd);

  const mergedModuleNameMapper = {
    ...moduleNameMapper,
    ...aliasMapper,
  };

  const resolver = jestConfig.resolver || DEFAULT_RESOLVER_PATH;

  // 这三个配置不能设置在 projects 中，需要设置在外层(https://github.com/facebook/jest/issues/9696)
  const configFields = ['coverage', 'collectCoverage', 'testTimeout'];
  const commonConfig = configFields.reduce((obj, field) => {
    if (jestConfig.hasOwnProperty(field)) {
      obj[field] = jestConfig[field as keyof typeof jestConfig];
    }
    return obj;
  }, {} as Record<string, unknown>);

  if (!apiOnly) {
    utils.setJestConfig(
      {
        projects: [
          {
            ...jestConfig,
          },
          {
            transform,
            moduleNameMapper: mergedModuleNameMapper,
            resolver,
            ...bffConfig,
          },
        ],
      },
      {
        force: true,
      },
    );
  } else {
    utils.setJestConfig(
      {
        projects: [
          {
            transform,
            moduleNameMapper: mergedModuleNameMapper,
            resolver,
            ...bffConfig,
          },
        ],
      },
      {
        force: true,
      },
    );
  }

  utils.setJestConfig(commonConfig);
};

export const testingBffPlugin = (): CliPlugin<{
  hooks: Hooks;
  userConfig: UserConfig;
  normalizedConfig: Required<UserConfig>;
}> => ({
  name: '@modern-js/testing-plugin-bff',

  setup(api) {
    return {
      jestConfig: async (utils, next) => {
        const appContext = api.useAppContext();
        const pwd = appContext.appDirectory;

        if (!isBFFProject(pwd)) {
          return next(utils);
        }

        const userConfig = api.useResolvedConfigContext();

        await setJestConfigForBFF({
          pwd,
          userConfig,
          routes: appContext.serverRoutes,
          plugins: appContext.serverPlugins,
          utils,
          appContext,
        });

        return next(utils);
      },
    };
  },
});
