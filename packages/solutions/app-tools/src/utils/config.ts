import * as path from 'path';
import { bundle } from '@modern-js/node-bundle-require';
import type { ServerConfig } from '@modern-js/server-core';
import {
  fs,
  CONFIG_FILE_EXTENSIONS,
  OUTPUT_CONFIG_FILE,
  ensureAbsolutePath,
  getServerConfig,
} from '@modern-js/utils';
import { stringify } from 'flatted';
import type { AppNormalizedConfig } from '../types';

export const defineServerConfig = (config: ServerConfig): ServerConfig =>
  config;

export const buildServerConfig = async ({
  appDirectory,
  distDirectory,
  configFile,
  options,
  watch,
}: {
  appDirectory: string;
  distDirectory: string;
  configFile: string;
  options?: Parameters<typeof bundle>[1];
  watch?: boolean;
}) => {
  const configFilePath = await getServerConfig(appDirectory, configFile);

  const getOutputFile = async (filepath: string) =>
    path.resolve(
      distDirectory,
      `${filepath.replace(
        new RegExp(CONFIG_FILE_EXTENSIONS.join('|')),
        '',
      )}.cjs`,
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
      watch,
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

export const emitResolvedConfig = async (
  appDirectory: string,
  resolvedConfig: AppNormalizedConfig<'shared'>,
) => {
  const outputPath = ensureAbsolutePath(
    appDirectory,
    path.join(
      resolvedConfig.output.distPath?.root || './dist',
      OUTPUT_CONFIG_FILE,
    ),
  );

  const output: string = stringify(resolvedConfig);

  await fs.writeFile(outputPath, output, {
    encoding: 'utf-8',
  });
};
