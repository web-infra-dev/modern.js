import path from 'path';
import { Import } from '@modern-js/utils';
import type { NormalizedConfig, IAppContext } from '@modern-js/core';
import { valid } from './utils/valid';

const storybook: typeof import('@storybook/react/standalone') = Import.lazy(
  '@storybook/react/standalone',
  require,
);
const constants: typeof import('./constants') = Import.lazy(
  './constants',
  require,
);
const gen: typeof import('./utils/genConfigDir') = Import.lazy(
  './utils/genConfigDir',
  require,
);
const webpackConfig: typeof import('./utils/webpackConfig') = Import.lazy(
  './utils/webpackConfig',
  require,
);

export interface IRunBuildOption {
  appContext: IAppContext;
  modernConfig: NormalizedConfig;
  stories: string[];
  isTsProject?: boolean;
}

const isQuiet = () => {
  const enableProgress =
    process.stdout.isTTY && process.env.MODERN_DISABLE_PROGRESS !== 'true';

  return !enableProgress;
};

export const runBuild = async ({
  appContext,
  modernConfig,
  stories,
  isTsProject = false,
}: IRunBuildOption) => {
  // TODO: 加一些debug
  const { appDirectory } = appContext;
  const {
    output: { path: outputPath = 'dist', disableTsChecker = false },
  } = modernConfig as NormalizedConfig & {
    // TODO 替换完整的类型
    output: {
      disableTsChecker: boolean;
    };
  };

  if (!valid({ stories, isTs: isTsProject, isModuleTools: true })) {
    return;
  }

  const configDir = await gen.generateConfig(appDirectory, {
    disableTsChecker,
    stories,
    modernConfig,
  });

  const handleWebpack = webpackConfig.getCustomWebpackConfigHandle({
    modernConfig,
    appContext,
    configDir,
    isTsProject,
    env: 'prod',
  });

  // NB: must set NODE_ENV
  process.env.NODE_ENV = 'production';

  await storybook({
    mode: 'static',
    configDir,
    outputDir: path.join(outputPath, constants.STORYBOOK_DIST_DIR_NAME),
    quiet: isQuiet(),
    customFinalWebpack: handleWebpack,
  });
};
