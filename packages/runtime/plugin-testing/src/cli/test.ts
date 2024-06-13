import path from 'path';
import { compiler } from '@modern-js/babel-compiler';
import type { PluginAPI } from '@modern-js/core';
import { runTest } from '../base';
import { Hooks } from '../base/hook';
import { UserConfig } from '../base/config';

const test = async (
  api: PluginAPI<{
    hooks: Hooks;
    userConfig: UserConfig;
    normalizedConfig: Required<UserConfig>;
  }>,
) => {
  const userConfig = api.useResolvedConfigContext();
  const appContext = api.useAppContext();

  const runner = api.useHookRunners();
  // eslint-disable-next-line no-unsafe-optional-chaining
  const { plugins = [] } = await (runner as any)._internalServerPlugins?.({
    plugins: [],
  });

  api.setAppContext({
    ...api.useAppContext(),
    serverPlugins: plugins,
  });

  userConfig.testing = userConfig.testing || {};

  const jest = userConfig.testing.jest || userConfig?.tools?.jest;

  if (Array.isArray(jest)) {
    userConfig.testing.jest = jest[0];
  }

  userConfig.testing.jest = userConfig.testing.jest || userConfig?.tools?.jest;

  const runtimeExportsPath = path.join(
    appContext.internalDirectory,
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

  await runTest(api, userConfig.testing);
};

export default test;
