import { Import } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/module-tools-v2';
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

export interface IRunDevOption {
  isTsProject?: boolean;
  stories: string[];
  isModuleTools?: boolean;
}

export const runDev = async (
  api: PluginAPI,
  { isTsProject = false, stories, isModuleTools = false }: IRunDevOption,
) => {
  const appContext = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const { appDirectory, port = constants.STORYBOOK_PORT } = appContext;

  if (!valid({ stories, isModuleTools, isTs: isTsProject })) {
    return;
  }

  const configDir = await gen.generateConfig(appDirectory, {
    isTsProject,
    stories,
    // TODO: 运行runtime相关功能的时候再处理
    modernConfig,
  });

  const handleWebpack = webpackConfig.getCustomWebpackConfigHandle({
    modernConfig,
    appContext,
    configDir,
    isTsProject,
    env: 'dev',
  });
  // NB: must set NODE_ENV
  process.env.NODE_ENV = 'development';

  storybook({
    ci: true,
    mode: 'dev',
    port,
    configDir,
    customFinalWebpack: handleWebpack,
  });
};
