import path from 'path';
import {
  TestConfigOperator,
  getModuleNameMapper,
  DEFAULT_RESOLVER_PATH,
} from '@modern-js/testing';
import type { CliPlugin } from '@modern-js/core';
import { bff_info_key } from './constant';
import { isBFFProject, existSrc } from './utils';

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

  const alias = userConfig?.source?.alias || {};

  const aliasMapper = getModuleNameMapper(alias);

  const { transform, moduleNameMapper } = utils.jestConfig;

  const isExistSrc = await existSrc(pwd);

  const mergedModuleNameMapper = {
    ...moduleNameMapper,
    ...aliasMapper,
  };

  const resolver = utils.jestConfig.resolver || DEFAULT_RESOLVER_PATH;

  if (isExistSrc) {
    utils.setJestConfig(
      {
        projects: [
          {
            ...utils.jestConfig,
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
