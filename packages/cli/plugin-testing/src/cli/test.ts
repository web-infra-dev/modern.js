import path from 'path';
import { compiler } from '@modern-js/babel-compiler';
import { runTest } from '@modern-js/testing';
import type { PluginAPI } from '@modern-js/core';

const test = async (api: PluginAPI) => {
  const userConfig = api.useResolvedConfigContext();
  const appContext = api.useAppContext();

  userConfig.testing = userConfig.testing || {};

  const jest = userConfig.testing.jest || userConfig.tools.jest;

  if (Array.isArray(jest)) {
    userConfig.testing.jest = jest[0];
  }

  userConfig.testing.jest = userConfig.testing.jest || userConfig.tools.jest;

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
