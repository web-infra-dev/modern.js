import path from 'path';
import { fs } from '@modern-js/utils';
import type {
  IAppContext,
  ModuleNormalizedConfig,
} from '@modern-js/module-tools';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import type { Configuration } from 'webpack';
import { merge } from '@modern-js/utils/lodash';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import { CURRENT_PKG_PATH } from '../constants';

// 改变storybook webpack config，有副作用
const resolveStorybookWebPackConfig = (
  sbWebpackConfig: Configuration,
  clientWebpackConfig: Configuration,
  { appDirectory }: { appDirectory: string },
) => {
  // override output
  sbWebpackConfig.output = clientWebpackConfig.output;
  // if (typeof clientWebpackConfig.output === 'object') {
  //   sbWebpackConfig.output = {
  //     ...clientWebpackConfig.output,
  //     publicPath:
  //       clientWebpackConfig.output?.publicPath === '/'
  //         ? '' // Keep it consistent with the storybook
  //         : clientWebpackConfig.output?.publicPath,
  //   };
  // } else {
  //   sbWebpackConfig.output = {
  //     publicPath: '',
  //   };
  // }

  // handle module rules
  const applyModuleRules = () => {
    if (!clientWebpackConfig.module?.rules) {
      return;
    }

    if (sbWebpackConfig.module) {
      const blackRuleList = [
        /\.css$/.toString(),
        /\.(svg|ico|jpg|jpeg|png|apng|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/.toString(),
        /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/.toString(),
        /\.(mjs|tsx?|jsx?)$/.toString(),
      ];

      // use builder rules instead of storybook rules. only preserve story-about rules
      sbWebpackConfig.module.rules = sbWebpackConfig.module.rules!.filter(
        (rule: any) => {
          if (rule.test?.toString) {
            return !blackRuleList.includes(rule.test.toString());
          }

          return true;
        },
      );

      sbWebpackConfig.module.rules.push(...clientWebpackConfig.module.rules);
    } else {
      sbWebpackConfig.module = clientWebpackConfig.module;
    }
  };

  applyModuleRules();

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

  const tsconfigPath = path.join(appDirectory, 'stories/tsconfig.json');

  if (fs.existsSync(tsconfigPath)) {
    sbWebpackConfig.resolve = sbWebpackConfig.resolve || {};
    const originalPlugins = sbWebpackConfig.resolve.plugins || [];

    sbWebpackConfig.resolve.plugins = [
      // remove project/tsconfig.json`s tsconfigpaths-plugin
      ...originalPlugins.filter(
        p => p?.constructor.name !== 'TsConfigPathsPlugin',
      ),
      new TsconfigPathsPlugin({
        configFile: path.join(appDirectory, 'stories/tsconfig.json'),
        mainFields: ['browser', 'module', 'main'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
      }),
    ];
  }

  sbWebpackConfig.plugins = [
    ...(sbWebpackConfig as any).plugins,
    ...(clientWebpackConfig as any).plugins,
  ];

  // sbWebpackConfig.plugins = (_sbWebpackConfig$plug = sbWebpackConfig.plugins) === null || _sbWebpackConfig$plug === void 0 ? void 0 : _sbWebpackConfig$plug.filter(p => p.constructor.name !== 'DefinePlugin');
};

export const createWebpackBuilder = async (builderConfig: BuilderConfig) => {
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );

  const webpackProvider = builderWebpackProvider({
    builderConfig,
  });

  const builder = await createBuilder(webpackProvider, {
    target: ['web'],
    entry: {},
  });

  return builder;
};

export const getCustomWebpackConfigHandle = async ({
  appContext,
  configDir,
  modernConfig,
}: {
  appContext: IAppContext;
  configDir: string;
  modernConfig: ModuleNormalizedConfig;
}) => {
  const { mergeBuilderConfig } = await import('@modern-js/builder');
  const { appDirectory } = appContext;

  const {
    buildConfig: _,
    buildPreset: __,
    dev,
    designSystem: ___,
    ...builderConfig
  } = modernConfig;

  let { builder } = appContext;

  if (!builder) {
    const storybookBuildConfig = dev?.storybook ?? {};

    const mergedConfig = mergeBuilderConfig(builderConfig as BuilderConfig, {
      tools: {
        webpack: storybookBuildConfig.webpack,
        webpackChain: storybookBuildConfig.webpackChain,
        babel(config, { removePlugins }) {
          // Remove babel-plugin-import when use module-tools
          // Keep the behavior consistent between storybook and module build
          if (appContext.toolsType === 'module-tools') {
            removePlugins('babel-plugin-import');
          }
        },
      },
      dev: {
        // use storybook hmr
        hmr: false,
      },
    });

    builder = await createWebpackBuilder(mergedConfig);
  }

  const { builderPluginStorybook } = await import('./builderPlugin');

  if (!builder.isPluginExists('builder-plugin-node-polyfill')) {
    const { builderPluginNodePolyfill } = await import(
      '@modern-js/builder-plugin-node-polyfill'
    );

    builder.addPlugins([builderPluginNodePolyfill()]);
  }

  builder.addPlugins([builderPluginStorybook({ appDirectory, configDir })]);

  const [config] = await builder.initConfigs();

  return (sbWebpackConfig: Configuration) => {
    config.resolve = merge({}, sbWebpackConfig.resolve, config.resolve);

    resolveStorybookWebPackConfig(sbWebpackConfig, config, {
      appDirectory,
    });
    return sbWebpackConfig;
  };
};
