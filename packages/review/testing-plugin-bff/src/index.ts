import { createPlugin } from '@modern-js/testing';
import { bff_info_key } from './constant';

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
        utils.mergeJestConfig({
          setupFilesAfterEnv: [require.resolve('./setup')],
          testEnvironment: require.resolve('./env'),
          globals: {
            [bff_info_key]: {
              appDir: pwd,
              modernUserConfig: userConfig,
              plugins,
              routes,
            },
          },
        });

        (global as any)[bff_info_key] = {
          appDir: pwd,
          modernUserConfig: userConfig,
          plugins,
          userConfig,
        };

        return next(utils);
      },
    }),
    {
      name: '@modern-js/testing-plugin-bff',
    },
  ) as any;

export { request as testBff } from './utils';
