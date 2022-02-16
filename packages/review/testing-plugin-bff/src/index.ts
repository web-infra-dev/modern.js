import path from 'path';
import {
  createPlugin,
  getModuleNameMapper,
  TestConfigOperator,
} from '@modern-js/testing';
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

  const { transform, moduleNameMapper, resolver } = utils.jestConfig;

  const isExistSrc = await existSrc(pwd);

  const mergedModuleNameMapper = {
    ...moduleNameMapper,
    ...aliasMapper,
  };

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

export default ({
  pwd,
  userConfig,
  plugins,
  routes,
}: {
  pwd: string;
  userConfig: any;
  plugins: any[];
  routes: any[];
}) =>
  createPlugin(
    () => ({
      jestConfig: async (utils, next) => {
        if (!isBFFProject(pwd)) {
          return next(utils);
        }

        await setJestConfigForBFF({
          pwd,
          userConfig,
          plugins,
          routes,
          utils,
        });

        return next(utils);
      },
    }),
    {
      name: '@modern-js/testing-plugin-bff',
    },
  );

export { request as testBff } from './utils';
