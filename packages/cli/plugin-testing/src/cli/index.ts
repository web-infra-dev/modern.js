import path from 'path';
import {
  PLUGIN_SCHEMAS,
  createRuntimeExportsUtils,
  isApiOnly,
} from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import {
  jestConfigHook,
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

  if (resolveJestConfig && typeof resolveJestConfig !== 'function') {
    testUtils.mergeJestConfig(resolveJestConfig);
  }

  if (typeof resolveJestConfig === 'function') {
    resolveJestConfig(testUtils.jestConfig);
  }
};

export default (): CliPlugin => {
  const BffPlugin = TestingBffPlugin();

  return {
    name: '@modern-js/plugin-testing',

    usePlugins: [BffPlugin],

    post: [BffPlugin.name!],

    registerHook: {
      jestConfig: jestConfigHook,
    },

    setup: api => {
      let testingExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;

      const appContext = api.useAppContext();
      const userConfig = api.useResolvedConfigContext();

      return {
        commands: ({ program }: any) => {
          program
            .command('test')
            .allowUnknownOption()
            .usage('[options]')
            .action(async () => {
              await test(api);
            });
        },

        validateSchema() {
          return PLUGIN_SCHEMAS['@modern-js/plugin-testing'];
        },

        config() {
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
          const apiOnly = await isApiOnly(appContext.srcDirectory);

          if (apiOnly) {
            return next(utils);
          }

          const webpackConfig = getWebpackConfig(WebpackConfigTarget.CLIENT);
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
          });

          utils.setJestConfig({
            rootDir: appContext.appDirectory || process.cwd(),
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
  };
};
