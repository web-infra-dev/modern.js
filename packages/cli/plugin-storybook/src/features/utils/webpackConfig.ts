import path from 'path';
import { fs } from '@modern-js/utils';
import type { IAppContext } from '@modern-js/module-tools-v2';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import type {
  Configuration,
  RuleSetRule,
  RuleSetConditionAbsolute,
} from 'webpack';
import { merge } from '@modern-js/utils/lodash';
import type { WebpackConfig } from '@modern-js/builder-webpack-provider';
import { JS_REGEX, TS_REGEX, mergeRegex } from '@modern-js/builder-shared';
import { CURRENT_PKG_PATH } from '../constants';

// 改变storybook webpack config，有副作用
const resolveStorybookWebPackConfig = (
  sbWebpackConfig: Configuration,
  clientWebpackConfig: Configuration,
  { appDirectory }: { appDirectory: string },
) => {
  // override output
  sbWebpackConfig.output = clientWebpackConfig.output;
  if (typeof clientWebpackConfig.output === 'object') {
    sbWebpackConfig.output = {
      ...clientWebpackConfig.output,
      publicPath:
        clientWebpackConfig.output?.publicPath === '/'
          ? '' // Keep it consistent with the storybook
          : clientWebpackConfig.output?.publicPath,
    };
  } else {
    sbWebpackConfig.output = {
      publicPath: '',
    };
  }

  // handle module rules
  if (sbWebpackConfig.module) {
    const blackRuleList = [
      /\.css$/.toString(),
      /\.(svg|ico|jpg|jpeg|png|apng|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/.toString(),
      /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/.toString(),
    ];
    // 更新 /\.(mjs|tsx?|jsx?)$/ 配置
    const jsAndTsRule = sbWebpackConfig.module.rules!.find(
      rule =>
        (rule as RuleSetRule).test &&
        (rule as RuleSetRule).test instanceof RegExp &&
        (rule as RuleSetRule).test?.toString &&
        (rule as any).test.toString() === /\.(mjs|tsx?|jsx?)$/.toString(),
    );
    const ruleWithOneOf = clientWebpackConfig.module?.rules!.find(rule =>
      Boolean((rule as RuleSetRule).oneOf),
    );
    const oneOf = ruleWithOneOf && (ruleWithOneOf as RuleSetRule).oneOf;

    if (!oneOf) {
      return;
    }

    const clientJsAndTsRule = oneOf.find(
      rule =>
        rule.test &&
        rule.test instanceof RegExp &&
        (rule.test.toString() === mergeRegex(JS_REGEX, TS_REGEX).toString() ||
          rule.test.toString() === JS_REGEX.toString()),
    );

    if (!clientJsAndTsRule || !jsAndTsRule) {
      return;
    }

    if (
      jsAndTsRule &&
      Array.isArray((jsAndTsRule as RuleSetRule).use) &&
      (jsAndTsRule as any).use[0] &&
      typeof (jsAndTsRule as any).use[0].options === 'object'
    ) {
      (jsAndTsRule as RuleSetRule).include = [
        ...((jsAndTsRule as RuleSetRule).include as RuleSetConditionAbsolute[]),
        ...(clientJsAndTsRule.include as RuleSetConditionAbsolute[]),
      ];
      (jsAndTsRule as RuleSetRule).test = clientJsAndTsRule.test;
      let { options } = (jsAndTsRule as any).use[0];
      options = {
        ...options,
        ...(clientJsAndTsRule as any).use[0].options,
        cacheDirectory: (jsAndTsRule as any).use[0].options.cacheDirectory,
        plugins: [
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ...options.plugins,
          ...((clientJsAndTsRule as any).use[0].options.plugins || []),
        ],
        presets: (clientJsAndTsRule as any).use[0].options.presets || [],
      };
    }

    sbWebpackConfig.module.rules = sbWebpackConfig.module.rules!.filter(
      (rule: any) => {
        if (rule.test?.toString) {
          return !blackRuleList.includes(rule.test.toString());
        }

        return true;
      },
    );
    const clientOneOfRule = (clientWebpackConfig as any).module.rules.filter(
      (rule: any) => Boolean(rule.oneOf),
    )[0];
    sbWebpackConfig.module.rules.push(clientOneOfRule);
  }
  // 处理 resolve
  // 将已经合并的 storybook 和 Client 的resolve 配置到 Storybook resolve上
  sbWebpackConfig.resolve = clientWebpackConfig.resolve;

  (sbWebpackConfig as any).resolve.alias['@styles'] = path.join(
    appDirectory,
    './styles',
  );

  const yarnNodeModulePath = path.resolve(CURRENT_PKG_PATH, './node_modules');

  if (fs.pathExistsSync(yarnNodeModulePath)) {
    (sbWebpackConfig as any).resolve.modules.push(yarnNodeModulePath);
  }

  const pnpmNodeModulesPath = path.resolve(
    CURRENT_PKG_PATH,
    '../../../node_modules',
  );

  if (fs.pathExistsSync(pnpmNodeModulesPath)) {
    (sbWebpackConfig as any).resolve.modules.push(pnpmNodeModulesPath);
  } // compat pnpm and yarn end

  if (Array.isArray(sbWebpackConfig.resolve!.plugins)) {
    sbWebpackConfig.resolve!.plugins.push(
      new TsconfigPathsPlugin({
        configFile: path.join(appDirectory, 'stories/tsconfig.json'),
      }),
    );
  } else {
    sbWebpackConfig.resolve!.plugins = [
      new TsconfigPathsPlugin({
        configFile: path.join(appDirectory, 'stories/tsconfig.json'),
      }),
    ];
  }

  sbWebpackConfig.plugins = [
    ...(sbWebpackConfig as any).plugins,
    ...(clientWebpackConfig as any).plugins,
  ];

  // sbWebpackConfig.plugins = (_sbWebpackConfig$plug = sbWebpackConfig.plugins) === null || _sbWebpackConfig$plug === void 0 ? void 0 : _sbWebpackConfig$plug.filter(p => p.constructor.name !== 'DefinePlugin');
};

export const getCustomWebpackConfigHandle = async ({
  appContext,
  configDir,
}: {
  appContext: IAppContext;
  configDir: string;
}) => {
  const { appDirectory } = appContext;

  if (!appContext.builder) {
    throw new Error(
      'Expect the Builder to have been initialized, But the appContext.builder received `undefined`',
    );
  }

  const { PluginStorybook } = await import('./builder-plugin');
  const { PluginNodePolyfill } = await import(
    '@modern-js/builder-plugin-node-polyfill'
  );

  appContext.builder.addPlugins([
    PluginNodePolyfill(),
    PluginStorybook({ appDirectory, configDir }),
  ]);

  // todo: call initConfig
  const {
    origin: { bundlerConfigs },
  } = await appContext.builder.inspectConfig();

  const config = bundlerConfigs[0] as WebpackConfig;

  return (sbWebpackConfig: Configuration) => {
    config.resolve = merge({}, config.resolve, sbWebpackConfig.resolve);

    resolveStorybookWebPackConfig(sbWebpackConfig, config, {
      appDirectory,
    });
    return sbWebpackConfig;
  };
};
