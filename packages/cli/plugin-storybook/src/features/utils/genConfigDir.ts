import path from 'path';
import type { ModuleNormalizedConfig } from '@modern-js/module-tools';
import { Import, fs, glob, logger } from '@modern-js/utils';
import { transformSync } from 'esbuild';
import type { PluginOptions } from '../../types';

const constants: typeof import('../constants') = Import.lazy(
  '../constants',
  require,
);
const gen: typeof import('./generate') = Import.lazy('./generate', require);

export type GenerateOptions = {
  modernConfig: ModuleNormalizedConfig;
  stories: string[];
  isTsProject: boolean;
  enableRuntime: boolean;
};

const defaultOptions = {
  stories: [],
  isTsProject: false,
};

export const getConfigDir = (appDir: string) => {
  const storybookConfigsPath = path.join(constants.CURRENT_PKG_PATH, 'configs');
  fs.ensureDirSync(storybookConfigsPath);
  const projectConfigPath = path.join(
    storybookConfigsPath,
    path.basename(appDir),
  );
  fs.ensureDirSync(projectConfigPath);
  return projectConfigPath;
};

export const generateConfig = async (
  appDirectory: string,
  pluginOption: PluginOptions,
  customOptions: Partial<GenerateOptions> = {},
) => {
  const options = { ...defaultOptions, ...customOptions };
  const {
    stories,
    modernConfig = {},
    isTsProject,
    enableRuntime = false,
  } = options;
  const userConfigDir = path.resolve(
    appDirectory,
    constants.STORYBOOK_USER_CONFIG_PATH,
  );
  const configDir = getConfigDir(appDirectory);
  const existUserConfig = await checkExistUserConfig(appDirectory);

  await initStoryBookDir(configDir);
  if (existUserConfig) {
    await copyOtherFile(userConfigDir, configDir);
    await checkMainFile(
      path.resolve(appDirectory, constants.STORYBOOK_USER_CONFIG_PATH),
    );
  }
  await genMainFile(appDirectory, {
    enableRuntime,
    configDir,
    stories,
    isTsProject,
  });

  await genPreviewFile(
    appDirectory,
    pluginOption,
    modernConfig as ModuleNormalizedConfig,
    configDir,
  );

  return configDir;
};

const getUserPreviewFiles = (filename: string) =>
  glob.sync(`${filename}.@(js|jsx|ts|tsx)`);

const genPreviewFile = async (
  appDirectory: string,
  pluginOption: PluginOptions,
  modernConfig: ModuleNormalizedConfig,
  configDir: string,
) => {
  const previewPath = path.join(appDirectory, '/config/storybook/preview');
  const userPreviewFiles = getUserPreviewFiles(previewPath);
  const existUserPreviewFile = userPreviewFiles.length > 0;
  let previewContent = gen.generatePreview({
    runtime: pluginOption.runtimeConfig ?? (modernConfig as any).runtime,
    designToken: {},
    userPreviewPath: existUserPreviewFile ? previewPath : undefined,
  });
  const previewFile = path.resolve(configDir, 'preview.js');
  if (existUserPreviewFile) {
    try {
      previewContent = transformSync(previewContent).code;
    } catch (e: unknown) {
      if (e instanceof Error) {
        logger.error(`Failed to generate 'preview' file: ${e.message}`);
      }
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
    await fs.outputFile(previewFile, previewContent, { encoding: 'utf8' });
  } else {
    await fs.outputFile(previewFile, previewContent, { encoding: 'utf8' });
  }
};

const checkExistUserConfig = (appDirectory: string) =>
  fs.pathExists(
    path.resolve(appDirectory, constants.STORYBOOK_USER_CONFIG_PATH),
  );

const initStoryBookDir = async (configDir: string) => {
  await fs.remove(configDir);
  await fs.ensureDir(configDir);
};

const copyOtherFile = (userConfigDir: string, configDir: string) =>
  fs.copy(userConfigDir, configDir);

const checkMainFile = async (storybookUserConfigPath: string) => {
  const blacklist = ['webpackFinal', 'babel', 'stories'];
  const dir = path.resolve(storybookUserConfigPath, 'main.js');
  const exist = await fs.pathExists(dir);
  if (exist) {
    const { default: userMainConfig } = await import(dir);
    const keys = Object.keys(userMainConfig);
    const errorKeys = keys.filter(key => blacklist.includes(key));
    // TODO 确定这里的判断逻辑
    if (errorKeys.length > 0) {
      console.warn(
        `config/storybook/main.js 中不应该存在 ${errorKeys.join(
          ', ',
        )}配置，请在 modern.config.js 中的 tools.webpack进行配置`,
      );
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }
};

const genMainFile = async (
  appDirectory: string,
  options: {
    configDir: string;
    stories: string[];
    isTsProject: boolean;
    enableRuntime: boolean;
  },
) => {
  const { configDir, stories, isTsProject = false, enableRuntime } = options;
  const mainContent = gen.generateMain({
    appDirectory,
    enableRuntime,
    stories,
    isTsProject,
  });
  const mainFile = path.resolve(configDir, 'main.js');
  await fs.outputFile(mainFile, mainContent, { encoding: 'utf8' });
};
