import path from 'path';
import {
  PLUGIN_SCHEMAS,
  createRuntimeExportsUtils,
  isApiOnly,
} from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import {
  testingHooks,
  TestConfigOperator,
  getModuleNameMapper,
  DEFAULT_RESOLVER_PATH,
} from '@modern-js/testing';
import { getWebpackConfig, WebpackConfigTarget } from '@modern-js/webpack';
import TestingBffPlugin from '@modern-js/testing-plugin-bff';
import { MODERNJS_CONFIG_KEY } from '../constant';
import test from './test';

export const mergeUserJestConfig = (testUtils: TestConfigOperator) => {
  const resolveJestConfig = testUtils.testConfig.jest;

  // resolveJestConfig 如果是函数类型，在所有测试插件 jestConfig 都执行后，再执行生成最终配置
  if (resolveJestConfig && typeof resolveJestConfig !== 'function') {
    testUtils.mergeJestConfig(resolveJestConfig);
  }
};

export default (): CliPlugin => {
  const BffPlugin = TestingBffPlugin();

  return {
    name: '@modern-js/plugin-testing',

    usePlugins: [BffPlugin],

    post: [BffPlugin.name!],

    registerHook: testingHooks,

    setup: api => {
      let testingExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;

      return {
        commands: ({ program }: any) => {
          program
            .command('test')
            .allowUnknownOption()
            .usage('<regexForTestFiles> --[options]')
            .action(async () => {
              await test(api);
            });
        },

        validateSchema() {
          return PLUGIN_SCHEMAS['@modern-js/plugin-testing'];
        },

        config() {
          const appContext = api.useAppContext();

          testingExportsUtils = createRuntimeExportsUtils(
            appContext.internalDirectory,
            'testing',
          );

          return {
            source: {
              alias: {
                '@modern-js/runtime/testing': testingExportsUtils.getPath(),
              },
            },
          };
        },

        addRuntimeExports() {
          const testingPath = path.resolve(__dirname, '../');
          testingExportsUtils.addExport(`export * from '${testingPath}'`);
        },

        jestConfig: async (utils, next) => {
          const appContext = api.useAppContext();
          const userConfig = api.useResolvedConfigContext();

          const apiOnly = await isApiOnly(appContext.appDirectory);

          if (apiOnly) {
            return next(utils);
          }

          const webpackConfig = getWebpackConfig(
            WebpackConfigTarget.CLIENT,
            appContext,
            userConfig,
          );
          const {
            resolve: { alias = {} },
          } = webpackConfig;

          utils.mergeJestConfig({
            globals: {
              [MODERNJS_CONFIG_KEY]: userConfig,
            },
            moduleNameMapper: getModuleNameMapper(alias),
            testEnvironment: 'jsdom',
            resolver: DEFAULT_RESOLVER_PATH,
            rootDir: appContext.appDirectory || process.cwd(),
            // todo: diffrernt test root for diffrent solutions
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
  };
};
