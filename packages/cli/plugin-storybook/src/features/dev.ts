import { Import, getPort, isEmpty } from '@modern-js/utils';
import type { PluginAPI, ModuleTools } from '@modern-js/module-tools';
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

export interface IRunDevOption {
  isTsProject?: boolean;
  stories: string[];
  isModuleTools?: boolean;
}

export const runDev = async (
  api: PluginAPI<ModuleTools>,
  { isTsProject = false, stories, isModuleTools = false }: IRunDevOption,
  pluginOption: PluginOptions,
) => {
  const appContext = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const { appDirectory, port } = appContext;

  if (!valid({ stories, isModuleTools, isTs: isTsProject })) {
    return;
  }

  const enableRuntime = modernConfig.runtime && !isEmpty(modernConfig.runtime);
  const configDir = await gen.generateConfig(appDirectory, pluginOption, {
    isTsProject,
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
  process.env.NODE_ENV = 'development';

  storybook({
    ci: true,
    mode: 'dev',
    port: await getPort(port || constants.STORYBOOK_PORT),
    configDir,
    customFinalWebpack: handleWebpack,
  }).catch(async (err: any) => {
    const { formatStats, logger } = await import('@modern-js/builder-shared');

    // catch & log storybook preview error
    if (err.toJSON) {
      const { message } = await formatStats(err);
      logger.log(message);
    } else if (err.toString) {
      logger.error(err.toString({ preset: 'errors-warnings' }));
    } else {
      logger.error(err);
    }

    // bail out, the storybook has dead
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
};
