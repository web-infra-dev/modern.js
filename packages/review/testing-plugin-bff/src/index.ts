import path from 'path';
import {
  TestConfigOperator,
  getModuleNameMapper,
  DEFAULT_RESOLVER_PATH,
} from '@modern-js/testing';
import type { CliPlugin } from '@modern-js/core';
import { isApiOnly } from '@modern-js/utils';
import { bff_info_key } from './constant';
import { isBFFProject } from './utils';

export const setJestConfigForBFF = async ({
  pwd,
  userConfig,
  plugins,
  routes,
  utils,
}: {
  pwd: string;
  userConfig: any;
  plugins: any[];
  routes: any[];
  utils: TestConfigOperator;
}) => {
  const bffConfig = {
    rootDir: path.join(pwd, './api'),
    setupFilesAfterEnv: [require.resolve('./setup')],
    testEnvironment: require.resolve('./env'),
    testMatch: [`**/api/**/*.test.[jt]s`],
    globals: {
      [bff_info_key]: {
        appDir: pwd,
        modernUserConfig: userConfig,
        plugins,
        routes,
      },
    },
  };

  const { jestConfig } = utils;
  const alias = userConfig?.source?.alias || {};

  const aliasMapper = getModuleNameMapper(alias);

  const { transform, moduleNameMapper } = jestConfig;

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

export default (): CliPlugin => ({
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
        const plugins = appContext.plugins.map(p => p.server).filter(Boolean);

        await setJestConfigForBFF({
          pwd,
          userConfig,
          plugins,
          routes: appContext.serverRoutes,
          utils,
        });

        return next(utils);
      },
    };
  },
});

export { request as testBff } from './utils';
