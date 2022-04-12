/* eslint-disable @typescript-eslint/no-unused-vars */
import path from 'path';
import { fs, Import } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import type {
  Configuration,
  RuleSetRule,
  RuleSetUseItem,
  RuleSetConditionAbsolute,
} from 'webpack';
import type Chain from 'webpack-chain';
import { CURRENT_PKG_PATH } from '../constants';

const WebpackConfig: typeof import('@modern-js/webpack') = Import.lazy(
  '@modern-js/webpack',
  require,
);
const NodePolyfillPlugin: typeof import('node-polyfill-webpack-plugin') =
  Import.lazy('node-polyfill-webpack-plugin', require);

class ClientNoEntryWebpackConfig extends WebpackConfig.ClientWebpackConfig {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  entry() {}
}

// 处理基础webpack配置
const getConfig = ({
  appContext,
  sbWebpackConfig,
  isTsProject,
  configDir,
  env,
  chain,
}: {
  appContext: IAppContext;
  modernConfig: NormalizedConfig;
  sbWebpackConfig: Configuration;
  isTsProject: boolean;
  configDir: string;
  env: 'prod' | 'dev';
  chain: Chain;
}) => {
  const { appDirectory } = appContext;
  const definePluginConfig: any = sbWebpackConfig.plugins?.filter(
    p => p.constructor.name === 'DefinePlugin',
  )[0];
  if (definePluginConfig) {
    chain.plugin('define').tap(definitions => {
      if (definePluginConfig.definitions['process.env']) {
        const envsKey = Object.keys(
          definePluginConfig.definitions['process.env'],
        );
        const copyEnvs = definePluginConfig.definitions['process.env'];
        envsKey.forEach(envKey => {
          definitions[0][`process.env.${envKey}`] = copyEnvs[envKey];
        });
        definitions[0]['process.env.NODE_ENV'] = JSON.stringify(
          env === 'dev' ? 'development' : 'production',
        );
      }

      return definitions;
    });
  }
  chain.plugin('polyfill').use(NodePolyfillPlugin);
  chain.module.rule('loaders').oneOfs.delete('fallback'); // 移除 fallback 规则
  chain.module.rule('loaders').oneOf('js').include.add(appDirectory); // 将内置webpack配置中对于 js(x)|ts(x) 的 rule 的include中添加项目的路径
  chain.plugins
    .delete('progress')
    .delete('case-sensitive')
    // main入口文件的 html-plugin
    .delete('html-main');
  chain.resolve.merge({ fallback: { perf_hooks: false } });

  // jsRuleConfig: 单独拿出 js(x)|ts(x) rule,准备替换上面移除过的 storybook  js(x)|ts(x) rule
  const jsRuleConfig = (
    chain.module.rule('loaders').oneOf('js') as any
  ).toConfig() as RuleSetRule;

  // config dir 针对内部的 storybook 配置目录下的文件做编译处理，复用js rules
  const configDirRuleChain = chain.module.rule('loaders').oneOf('config-dir');
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

  (sbWebpackConfig.resolve!.alias as any)['@styles'] = path.join(
    appDirectory,
    './styles',
  );
  chain.merge({ resolve: sbWebpackConfig.resolve });
  return {
    config: chain.toConfig(),
    jsRule: jsRuleConfig,
  };
};

// 改变storybook webpack config，有副作用
const resolveStorybookWebPackConfig = (
  sbWebpackConfig: Configuration,
  clientWebpackConfig: Configuration,
  { appDirectory }: { appDirectory: string },
) => {
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
        (rule.test.toString() === /\.(js|mjs|jsx)$|\.tsx?$/.toString() ||
          rule.test.toString() === /\.(js|mjs|jsx)$/.toString()),
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
    sbWebpackConfig.module.rules.push(
      (clientWebpackConfig as any).module.rules[1],
    );
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
  env,
}: {
  appContext: IAppContext;
  modernConfig: NormalizedConfig;
  configDir: string;
  isTsProject: boolean;
  env: 'dev' | 'prod';
}) => {
  const { appDirectory } = appContext;
  const webpackConfig = new ClientNoEntryWebpackConfig(
    appContext,
    modernConfig,
  );
  const chain: Chain = webpackConfig.getChain();
  chain.plugin('polyfill').use(NodePolyfillPlugin);
  chain.module.rule('loaders').oneOfs.delete('fallback'); // 移除 fallback 规则
  chain.plugins
    .delete('progress')
    .delete('case-sensitive') // main入口文件的 html-plugin
    .delete('html-main')
    // remove `ForkTsCheckerWebpackPlugin`, because storybook is supported
    .delete('ts-checker');
  chain.resolve.merge({
    fallback: {
      perf_hooks: false,
    },
  });

  const jsRuleConfig = (
    chain.module.rule('loaders').oneOf('js') as any
  ).toConfig() as RuleSetRule; // config dir 针对内部的 storybook 配置目录下的文件做编译处理，复用js rules
  const configDirRuleChain = chain.module.rule('loaders').oneOf('config-dir');
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
