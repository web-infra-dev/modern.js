import path from 'path';
import { createPlugin } from '@modern-js/testing';
import { chalk } from '@modern-js/utils';
import { bff_info_key } from './constant';

const isBFFProject = (pwd: string) => {
  try {
    // eslint-disable-next-line import/no-dynamic-require,@typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
    const packageJson = require(path.join(pwd, './package.json'));

    const { dependencies, devDependencies } = packageJson;

    const isBFF = Object.keys({ ...dependencies, ...devDependencies }).some(
      (dependency: string) => dependency.includes('plugin-bff'),
    );

    const isMWA = Object.keys(devDependencies).some((devDependency: string) =>
      devDependency.includes('app-tools'),
    );

    return isMWA && isBFF;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(chalk.red(error));
    return false;
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

        const { transform, moduleNameMapper, resolver } = utils.jestConfig;

        utils.setJestConfig(
          {
            projects: [
              {
                ...utils.jestConfig,
              },
              {
                transform,
                moduleNameMapper,
                resolver,
                ...bffConfig,
              },
            ],
          },
          {
            force: true,
          },
        );
        return next(utils);
      },
    }),
    {
      name: '@modern-js/testing-plugin-bff',
    },
  );

export { request as testBff } from './utils';
