import path from 'node:path';
import type {
  AppToolsNormalizedConfig,
  RuntimePluginConfig,
} from '@modern-js/app-tools';
import type { Entrypoint } from '@modern-js/types';
import { JS_EXTENSIONS, findExists, getEntryOptions } from '@modern-js/utils';
import { createJiti } from 'jiti';

export const getRuntimeConfig = async (
  modernRuntimeFile: string,
  entryName: string,
) => {
  const jiti = createJiti(__filename, {
    moduleCache: false,
    extensions: [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.mjs',
      '.cjs',
      '.mts',
      '.cts',
      '.json',
    ],
    jsx: true,
  });
  const configModule = await jiti(modernRuntimeFile);

  const rawConfig =
    typeof configModule.default === 'function'
      ? configModule.default(entryName)
      : configModule.default;

  return Object.fromEntries(
    Object.entries(rawConfig)
      .filter(([key]) => key !== 'plugins')
      .map(([k, v]: any) => [k, { enable: !!v?.enable }]),
  );
};

export const getRuntimePluginEnableState = async ({
  packageName,
  entrypoint,
  config,
  runtimeConfigFile,
  runtimePlugins,
  srcDirectory,
  appDirectory,
}: {
  packageName: string;
  entrypoint: Entrypoint;
  config: AppToolsNormalizedConfig;
  runtimeConfigFile: string;
  runtimePlugins: RuntimePluginConfig[];
  srcDirectory: string;
  appDirectory: string;
}) => {
  const result: Record<string, boolean> = {};
  await Promise.all(
    runtimePlugins.map(async runtimePlugin => {
      const name = runtimePlugin.name;
      const configName = name === 'garfish' ? 'masterApp' : name;
      const runtimeConfig = getEntryOptions(
        entrypoint.entryName,
        entrypoint.isMainEntry!,
        config.runtime,
        config.runtimeByEntries,
        packageName,
      );
      if (runtimeConfig?.[configName]) {
        result[name] = true;
      } else {
        const modernRuntimeFile = findExists(
          JS_EXTENSIONS.map(ext =>
            path.resolve(
              appDirectory,
              `${path.join(srcDirectory, runtimeConfigFile)}${ext}`,
            ),
          ),
        );
        if (modernRuntimeFile) {
          const runtimeConfig = await getRuntimeConfig(
            modernRuntimeFile,
            entrypoint.entryName,
          );
          if (runtimeConfig?.[configName]?.enable) {
            result[name] = true;
          }
        }
      }
    }),
  );
  return result;
};
