import path from 'path';
import { createPlugin } from '@modern-js/testing';
import { modernjs_config_key } from '@/constant';

const getModuleNameMapper = (config: any) => {
  const {
    resolve: { alias = {} },
  } = config;

  return Object.keys(alias).reduce((memo, cur) => {
    const aliasValue = Array.isArray(alias[cur]) ? alias[cur] : [alias[cur]];

    const isFile = aliasValue.some((s: string) => s.endsWith('.js'));

    // It's special for if using @modern-js/runtime alias other module @modern-js/runtime/model would not work.
    if (cur === '@modern-js/runtime$') {
      memo[`.+${cur}`] = aliasValue[0];

      return memo;
    }

    if (isFile) {
      memo[cur] = aliasValue[0];
    }

    const key = `^${cur}/(.*)$`;
    const value = path.normalize(`${aliasValue}/$1`);
    memo[key] = value;
    return memo;
  }, {} as any);
};

export default (webpackConfig: any, userConfig: any, pwd: string) =>
  createPlugin(
    () => ({
      jestConfig: (utils: any, next: any) => {
        utils.mergeJestConfig({
          globals: {
            [modernjs_config_key]: userConfig,
          },
          moduleNameMapper: getModuleNameMapper(webpackConfig),
          testEnvironment: 'jsdom',
          resolver: require.resolve('../resolver'),
        });

        utils.setJestConfig({
          rootDir: pwd || process.cwd(),
          // todo: diffrent test root for diffrent solutions
          testMatch: [`**/(src|tests|api|electron)/**/*.test.[jt]s?(x)`],
        });

        return next(utils);
      },
    }),
    {
      name: '@modern-js/testing-plugin-modern',
    },
  ) as any;
