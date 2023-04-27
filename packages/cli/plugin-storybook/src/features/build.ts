import path from 'path';
import { Import, isEmpty } from '@modern-js/utils';
import type {
  ModuleNormalizedConfig,
  IAppContext,
} from '@modern-js/module-tools';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { PluginOptions } from '../types';
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
  modernConfig: ModuleNormalizedConfig;
  stories: string[];
  isTsProject?: boolean;
}

const isQuiet = () => {
  const enableProgress =
    process.stdout.isTTY && process.env.MODERN_DISABLE_PROGRESS !== 'true';

  return !enableProgress;
};

export const runBuild = async (
  pluginOption: PluginOptions,
  { appContext, modernConfig, stories, isTsProject = false }: IRunBuildOption,
) => {
  // TODO: add some debug code
  const { appDirectory } = appContext;
  const { output: { distPath } = {} } = modernConfig as BuilderConfig;
  const outputPath = distPath?.root || 'dist';

  if (!valid({ stories, isTs: isTsProject, isModuleTools: true })) {
    return;
  }

  const enableRuntime = modernConfig.runtime && !isEmpty(modernConfig.runtime);
  const configDir = await gen.generateConfig(appDirectory, pluginOption, {
    stories,
    enableRuntime,
    modernConfig,
  });

  const handleWebpack = await webpackConfig.getCustomWebpackConfigHandle({
    appContext,
    configDir,
    modernConfig,
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
