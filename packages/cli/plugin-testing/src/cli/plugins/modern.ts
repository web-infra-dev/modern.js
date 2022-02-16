import { createPlugin, getModuleNameMapper } from '@modern-js/testing';
import type { NormalizedConfig } from '@modern-js/core';
import { modernjs_config_key } from '../../constant';

export const mergeUserJestConfig = async (testUtils: any) => {
  const resolveJestConfig = testUtils.testConfig.jest;

  if (resolveJestConfig && typeof resolveJestConfig !== 'function') {
    testUtils.mergeJestConfig(resolveJestConfig);
  }

  if (typeof resolveJestConfig === 'function') {
    await resolveJestConfig(testUtils.jestConfig);
  }
};

export default (
  webpackConfig: any,
  userConfig: NormalizedConfig,
  pwd: string,
) =>
  createPlugin(
    () => {
      const {
        resolve: { alias = {} },
      } = webpackConfig;

      return {
        jestConfig: (utils: any, next: any) => {
          utils.mergeJestConfig({
            globals: {
              [modernjs_config_key]: userConfig,
            },
            moduleNameMapper: getModuleNameMapper(alias),
            testEnvironment: 'jsdom',
            resolver: require.resolve('../resolver'),
          });

          utils.setJestConfig({
            rootDir: pwd || process.cwd(),
            // todo: diffrent test root for diffrent solutions
            // testMatch: [`<rootDir>/(src|tests|electron)/**/*.test.[jt]s?(x)`],
            // testMatch bug on windows, issue: https://github.com/facebook/jest/issues/7914
            testMatch: [
              `<rootDir>/src/**/*.test.[jt]s?(x)`,
              `<rootDir>/tests/**/*.test.[jt]s?(x)`,
              `<rootDir>/electron/**/*.test.[jt]s?(x)`,
            ],
          });

          mergeUserJestConfig(utils);

          return next(utils);
        },
      };
    },
    {
      name: '@modern-js/testing-plugin-modern',
    },
  ) as any;
