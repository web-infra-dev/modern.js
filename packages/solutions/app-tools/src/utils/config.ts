import * as path from 'path';
import { bundle } from '@modern-js/node-bundle-require';
import {
  CONFIG_FILE_EXTENSIONS,
  fs,
  getServerConfig,
  OUTPUT_CONFIG_FILE,
} from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';

import type { ServerConfig } from '@modern-js/server-core';

export const defineServerConfig = (config: ServerConfig): ServerConfig =>
  config;

export const buildServerConfig = async ({
  appDirectory,
  distDirectory,
  configFile,
  options,
}: {
  appDirectory: string;
  distDirectory: string;
  configFile: string;
  options?: Parameters<typeof bundle>[1];
}) => {
  const configFilePath = await getServerConfig(appDirectory, configFile);

  const getOutputFile = async (filepath: string) =>
    path.resolve(
      distDirectory,
      `${filepath.replace(
        new RegExp(CONFIG_FILE_EXTENSIONS.join('|')),
        '',
      )}.js`,
    );

  if (configFilePath) {
    const configHelperFilePath = path.normalize(
      path.join(distDirectory, './config-helper.js'),
    );
    const helperCode = `
      export const defineConfig = (config) => config;
    `;

    await fs.ensureDir(distDirectory);
    await fs.writeFile(configHelperFilePath, helperCode);
    await bundle(configFilePath, {
      ...options,
      getOutputFile,
      esbuildPlugins: [
        {
          name: 'native-build-config',
          setup(ctx) {
            ctx.onResolve(
              {
                filter: /app-tools\/server/,
              },
              () => {
                return {
                  path: configHelperFilePath,
                };
              },
            );
          },
        },
      ],
    });
  }
};

/**
 *
 * 处理循环引用的 replacer
 */
export const safeReplacer = () => {
  const cache: unknown[] = [];
  const keyCache: string[] = [];
  return function (key: string, value: unknown) {
    if (typeof value === 'object' && value !== null) {
      const index = cache.indexOf(value);
      if (index !== -1) {
        return `[Circular ${keyCache[index]}]`;
      }
      cache.push(value);
      keyCache.push(key || 'root');
    }
    return value;
  };
};

export const emitResolvedConfig = async (
  appDirectory: string,
  resolvedConfig: NormalizedConfig,
) => {
  const outputPath = path.join(
    appDirectory,
    resolvedConfig?.output?.path || './dist',
    OUTPUT_CONFIG_FILE,
  );
  await fs.writeJSON(outputPath, resolvedConfig, {
    spaces: 2,
    replacer: safeReplacer(),
  });
};
