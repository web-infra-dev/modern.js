import path from 'path';
import { Import } from '@modern-js/utils';
import type {
  ModuleNormalizedConfig,
  IAppContext,
} from '@modern-js/module-tools-v2';
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

export const runBuild = async ({
  appContext,
  modernConfig,
  stories,
  isTsProject = false,
}: IRunBuildOption) => {
  // TODO: add some debug code
  const { appDirectory } = appContext;
  // FIXME: remove the `any` type;
  const {
    output: { path: outputPath = 'dist' },
  } = modernConfig as any;

  if (!valid({ stories, isTs: isTsProject, isModuleTools: true })) {
    return;
  }

  const configDir = await gen.generateConfig(appDirectory, {
    stories,
    modernConfig,
  });

  const handleWebpack = await webpackConfig.getCustomWebpackConfigHandle({
    appContext,
    configDir,
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
