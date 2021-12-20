import path from 'path';
import { createPlugin } from '@modern-js/testing';
import { bff_info_key } from './constant';

const isBFFProject = (pwd: string) => {
  try {
    // eslint-disable-next-line import/no-dynamic-require,@typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
    const packageJson = require(path.join(pwd, './package.json'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    let isMWA = false;
    let isBFF = false;
    Object.keys(dependencies).forEach(key => {
      if (key.includes('app-tools')) {
        isMWA = true;
      }
      if (key.includes('plugin-bff')) {
        isBFF = true;
      }
    });
    return isMWA && isBFF;
  } catch (error) {
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

        utils.setJestConfig(
          {
            projects: [
              {
                ...utils.jestConfig,
              },
              {
                ...utils.jestConfig,
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
