import path from 'path';
import { Import } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import type { Configuration, RuleSetRule, RuleSetUseItem } from 'webpack';
import type Chain from 'webpack-chain';

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
const resolveStorybookWebPackConfig = (sbWebpackConfig: Configuration) => {
  if (sbWebpackConfig.module) {
    const blackRuleList = [
      /\.(mjs|tsx?|jsx?)$/.toString(),
      /\.css$/.toString(),
      /\.(svg|ico|jpg|jpeg|png|apng|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/.toString(),
      /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/.toString(),
    ];
    sbWebpackConfig.module.rules = sbWebpackConfig.module?.rules?.slice(1, 8); // 移除storybook本身对于 js(x)|ts(x)的 rule 的loader
    sbWebpackConfig.module.rules?.filter(rule => {
      const r = rule as RuleSetRule;
      if (r.test && typeof r.test === 'string') {
        return blackRuleList.includes(r.test?.toString());
      }
      return true;
    });
  }
  sbWebpackConfig.plugins = sbWebpackConfig.plugins?.filter(
    p => p.constructor.name !== 'DefinePlugin',
  );
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
  const webpackConfig = new ClientNoEntryWebpackConfig(
    appContext,
    modernConfig,
  );
  const chain: Chain = webpackConfig.getChain();

  return (sbWebpackConfig: Configuration) => {
    const { config, jsRule } = getConfig({
      appContext,
      modernConfig,
      sbWebpackConfig,
      configDir,
      isTsProject,
      env,
      chain,
    });

    resolveStorybookWebPackConfig(sbWebpackConfig);

    const finaleModule = {
      ...config.module,
      rules: [
        jsRule,
        ...(sbWebpackConfig.module?.rules || []),
        ...(config.module?.rules as RuleSetRule[]),
      ],
    };
    const finalConfig = {
      ...sbWebpackConfig,
      module: finaleModule,
      plugins: [...(sbWebpackConfig.plugins || []), ...(config.plugins || [])],
      resolve: config.resolve,
    };
    return finalConfig;
  };
};
