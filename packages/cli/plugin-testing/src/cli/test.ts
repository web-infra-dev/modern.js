import path from 'path';
import { compiler } from '@modern-js/babel-compiler';
import { useAppContext, useResolvedConfigContext } from '@modern-js/core';
import { runTest } from '@modern-js/testing';
import { getWebpackConfig, WebpackConfigTarget } from '@modern-js/webpack';
import testingBffPlugin from '@modern-js/testing-plugin-bff';
import modernTestPlugin from './plugins/modern';

const test = async () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const userConfig = useResolvedConfigContext();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const config = useAppContext();

  // todo: consider lib-tools ...
  const webpackConfigs = getWebpackConfig(WebpackConfigTarget.CLIENT);

  userConfig.testing = userConfig.testing || {};

  const jest = userConfig.testing.jest || (userConfig.tools as any).jest;

  if (Array.isArray(jest)) {
    userConfig.testing.jest = jest[0];
  }

  userConfig.testing.jest =
    userConfig.testing.jest || (userConfig.tools as any).jest;

  userConfig.testing.plugins = [
    ...(userConfig.testing.plugins || []),
    modernTestPlugin(webpackConfigs, userConfig, config.appDirectory),
    testingBffPlugin({
      pwd: config.appDirectory,
      userConfig,
      plugins: config.plugins.map(p => p.server).filter(Boolean),
      routes: (config as any).serverRoutes,
    }),
  ];

  const runtimeExportsPath = path.join(
    config.internalDirectory,
    '.runtime-exports',
  );

  await compiler(
    {
      sourceDir: runtimeExportsPath,
      rootDir: runtimeExportsPath,
      distDir: runtimeExportsPath,
      quiet: true,
    },
    {
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            modules: 'cjs',
          },
        ],
      ],
    },
  );

  await runTest(userConfig.testing);
};

export default test;

declare module '@modern-js/core' {
  interface UserConfig {
    testing?: import('@modern-js/testing').TestConfig;
  }

  interface ToolsConfig {
    jest?: import('@modern-js/testing').TestConfig['jest'];
  }
}
