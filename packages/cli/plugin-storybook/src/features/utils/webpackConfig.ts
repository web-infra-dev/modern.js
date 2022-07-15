/* eslint-disable @typescript-eslint/no-unused-vars */
import path from 'path';
import { fs, Import, CHAIN_ID } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import type {
  Configuration,
  RuleSetRule,
  RuleSetUseItem,
  RuleSetConditionAbsolute,
} from 'webpack';
import type Chain from 'webpack-chain';
import {
  ClientWebpackConfig,
  JS_REGEX,
  TS_REGEX,
  mergeRegex,
} from '@modern-js/webpack';
import { CURRENT_PKG_PATH } from '../constants';

const NodePolyfillPlugin: typeof import('node-polyfill-webpack-plugin') =
  Import.lazy('node-polyfill-webpack-plugin', require);

class ClientNoEntryWebpackConfig extends ClientWebpackConfig {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  entry() {}
}

// 改变storybook webpack config，有副作用
const resolveStorybookWebPackConfig = (
  sbWebpackConfig: Configuration,
  clientWebpackConfig: Configuration,
  { appDirectory }: { appDirectory: string },
) => {
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

  sbWebpackConfig.plugins = [
    ...(sbWebpackConfig as any).plugins,
    ...(clientWebpackConfig as any).plugins,
  ];

  // sbWebpackConfig.plugins = (_sbWebpackConfig$plug = sbWebpackConfig.plugins) === null || _sbWebpackConfig$plug === void 0 ? void 0 : _sbWebpackConfig$plug.filter(p => p.constructor.name !== 'DefinePlugin');
};

export const getCustomWebpackConfigHandle: any = ({
  appContext,
  modernConfig,
  configDir,
  isTsProject = false,
}: {
  appContext: IAppContext;
  modernConfig: NormalizedConfig;
  configDir: string;
  isTsProject: boolean;
  env: 'dev' | 'prod';
}) => {
  const { RULE, PLUGIN, ONE_OF } = CHAIN_ID;
  const { appDirectory } = appContext;

  // Manual configuration `output.path = 'storybook-static'`;
  modernConfig.output.path = './dist/storybook-static';

  const webpackConfig = new ClientNoEntryWebpackConfig(
    appContext,
    modernConfig,
  );
  const chain: Chain = webpackConfig.getChain();
  chain.plugin('polyfill').use(NodePolyfillPlugin);

  // 移除 fallback 规则
  chain.module.rule(RULE.LOADERS).oneOfs.delete(ONE_OF.FALLBACK);

  chain.plugins
    .delete(PLUGIN.PROGRESS)
    // main 入口文件的 html-plugin
    .delete(`${PLUGIN.HTML}-main`)
    // remove `ForkTsCheckerWebpackPlugin`, because storybook is supported
    .delete(PLUGIN.TS_CHECKER);

  chain.resolve.merge({
    fallback: {
      perf_hooks: false,
    },
  });

  const jsRuleConfig = (
    chain.module.rule(RULE.LOADERS).oneOf(ONE_OF.JS) as any
  ).toConfig() as RuleSetRule;

  // config dir 针对内部的 storybook 配置目录下的文件做编译处理，复用 js rules
  const configDirRuleChain = chain.module
    .rule(RULE.LOADERS)
    .oneOf('config-dir');

  configDirRuleChain
    .test(isTsProject ? /\.(js|mjs|jsx|ts|tsx)$/ : /\.(js|mjs|jsx)$/)
    .include.add(configDir)
    .end()
    .enforce('pre')
    .use('a')
    .merge({
      ...((jsRuleConfig.use as RuleSetUseItem[])[0] as Record<string, any>),
    });
  chain.module.rule('js').merge(jsRuleConfig);

  return (sbWebpackConfig: Configuration) => {
    chain.merge({
      resolve: sbWebpackConfig.resolve,
    });
    const config = chain.toConfig();
    resolveStorybookWebPackConfig(sbWebpackConfig, config, { appDirectory });
    return sbWebpackConfig;
  };
};
/* eslint-enable @typescript-eslint/no-unused-vars */
