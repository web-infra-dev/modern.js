import path from 'node:path';
import { set } from '@modern-js/utils/lodash';
import type { PluginAPI } from '../../types';
import { generateNodeExternals } from '../builder';
import { NODE_BUILTIN_MODULES } from '../constant';
import { appendTo } from '../utils';

export interface ApplyConfigParams {
  rsbuild?: Parameters<PluginAPI['modifyRsbuildConfig']>[0];
  rspack?: Parameters<PluginAPI['modifyRspackConfig']>[0];
}

export const applyConfig = (api: PluginAPI, options?: ApplyConfigParams) => {
  let baseDistPath: string;

  api.modifyRsbuildConfig((config, utils) => {
    if (!config.environments?.node) {
      return;
    }
    const { appDirectory } = api.getAppContext();
    const userConfig = api.getConfig();
    baseDistPath = path.join(
      appDirectory,
      userConfig.output?.distPath?.root || 'dist',
    );
    options?.rsbuild?.(config, utils);
  });

  const nodeExternals = Object.fromEntries(
    generateNodeExternals(
      api => `module-import node:${api}`,
      NODE_BUILTIN_MODULES,
    ),
  );

  api.modifyRspackConfig((config, utils) => {
    const outputPath = config.output?.path;
    if (config.target !== 'node' || !baseDistPath || !outputPath) {
      return;
    }

    const isTsProject = Boolean(config.resolve?.tsConfig);
    const isEsmProject = Boolean(config.output?.module);

    config.target = 'es2020';
    if (isTsProject || isEsmProject) {
      set(config, 'output.chunkFormat', 'module');
      set(config, 'output.chunkLoading', 'singleBundleChunkLoad');
      set(config, 'output.module', true);
      set(config, 'output.library.type', 'module');
      set(config, 'experiments.outputModule', true);
    }

    appendTo(config, 'externals', nodeExternals);

    try {
      options?.rspack?.(config, utils);
    } catch (e) {
      console.error(e);
    }
  });
};
