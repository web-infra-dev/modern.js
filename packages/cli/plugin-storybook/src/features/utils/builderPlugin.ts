import path from 'path';
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';
import type { RuleSetRule, RuleSetUseItem } from 'webpack';
import { mergeBuilderConfig } from '@modern-js/builder-shared';

export const builderPluginStorybook = ({
  configDir,
  appDirectory,
}: {
  configDir: string;
  appDirectory: string;
}): BuilderPlugin => ({
  name: 'builder-plugin-storybook',

  setup(api) {
    api.modifyBuilderConfig(config => {
      return mergeBuilderConfig(config, {
        output: {
          enableAssetFallback: false,
        },
      });
    });

    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const { RULE, PLUGIN } = CHAIN_ID;
      const isTsProject = Boolean(api.context.tsconfigPath);

      chain.target('web');

      chain.output.path(path.join(api.context.distPath, 'storybook-static'));

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

      !isTsProject &&
        chain.resolve.merge({
          alias: {
            packageName: appDirectory,
          },
        });

      const jsRuleConfig = (
        chain.module.rule(RULE.JS) as any
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
          ...(jsRuleConfig.use
            ? ((jsRuleConfig.use as RuleSetUseItem[])[0] as Record<string, any>)
            : {}),
        });
    });
  },
});
