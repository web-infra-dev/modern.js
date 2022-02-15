import path from 'path';
import { createPlugin, getModuleNameMapper } from '@modern-js/testing';
import { bff_info_key } from './constant';
import { isBFFProject, existSrc } from './utils';

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

        const {
          source: { alias },
        } = userConfig;

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
        return next(utils);
      },
    }),
    {
      name: '@modern-js/testing-plugin-bff',
    },
  );

export { request as testBff } from './utils';
