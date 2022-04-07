import * as path from 'path';
import { bundle } from '@modern-js/node-bundle-require';
import {
  CONFIG_CACHE_DIR,
  CONFIG_FILE_EXTENSIONS,
  fs,
  getServerConfig,
} from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';

import type { ServerConfig } from '@modern-js/prod-server';

export const defineServerConfig = (config: ServerConfig): ServerConfig =>
  config;

export const buildServerConfig = async (
  appDirectory: string,
  configFile: string,
  options?: Parameters<typeof bundle>[1],
) => {
  const configFilePath = await getServerConfig(appDirectory, configFile);

  const getOutputFile = (filepath: string) =>
    path.resolve(
      CONFIG_CACHE_DIR,
      `${filepath.replace(
        new RegExp(CONFIG_FILE_EXTENSIONS.join('|')),
        '',
      )}.js`,
    );

  if (configFilePath) {
    await bundle(configFilePath, {
      ...options,
      getOutputFile,
    });
  }
};

export const emitResolvedConfig = async (
  appDirectory: string,
  resolvedConfig: NormalizedConfig,
) => {
  const outputPath = path.join(
    appDirectory,
    resolvedConfig?.output?.path || './dist',
    'modern.config.json',
  );
  await fs.writeJSON(outputPath, resolvedConfig, {
    spaces: 2,
  });
};
