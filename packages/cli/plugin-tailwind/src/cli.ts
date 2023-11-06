import path from 'path';
import { fs, CONFIG_CACHE_DIR, globby, slash } from '@modern-js/utils';
import type { LegacyAppTools, NormalizedConfig } from '@modern-js/app-tools';
import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import { designTokenPlugin } from './design-token/cli';
import { getTailwindConfig, loadConfigFile } from './config';
import { getTailwindPath, getTailwindVersion } from './utils';
import {
  template,
  checkTwinMacroExist,
  getTwinMacroMajorVersion,
  getRandomTwConfigFileName,
} from './macro';

export const tailwindcssPlugin = (
  { pluginName } = {
    pluginName: '@modern-js/plugin-tailwindcss',
  },
): CliPlugin<LegacyAppTools & ModuleTools> => ({
  name: '@modern-js/plugin-tailwindcss',

  // support designSystem.supportStyledComponents
  usePlugins: [
    designTokenPlugin({
      pluginName,
    }),
  ],

  setup: async api => {
    const { appDirectory, internalDirectory } = api.useAppContext();
    let internalTwConfigPath = '';
    // When reinstalling dependencies, most of the time the project will be restarted
    const haveTwinMacro = await checkTwinMacroExist(appDirectory);
    const tailwindPath = getTailwindPath(appDirectory);
    const tailwindVersion = getTailwindVersion(appDirectory);
    const userTailwindConfig = await loadConfigFile(appDirectory);

    return {
      prepare() {
        if (haveTwinMacro) {
          // twin.macro >= v3.0.0 support config object
          // twin.macro < v3.0.0 only support config path
          // https://github.com/ben-rogerson/twin.macro/releases/tag/3.0.0
          const twinMajorVersion = getTwinMacroMajorVersion(appDirectory);
          const useConfigPath = twinMajorVersion && twinMajorVersion < 3;

          if (useConfigPath) {
            internalTwConfigPath = getRandomTwConfigFileName(internalDirectory);
            const globPattern = slash(
              path.join(appDirectory, CONFIG_CACHE_DIR, '*.cjs'),
            );
            const files = globby.sync(globPattern, {
              absolute: true,
            });
            if (files.length > 0) {
              fs.writeFileSync(
                internalTwConfigPath,
                template(files[files.length - 1]),
                'utf-8',
              );
            }
          }
        }
      },
      config() {
        let tailwindConfig: Record<string, any>;

        const initTailwindConfig = () => {
          if (!tailwindConfig) {
            const modernConfig = api.useResolvedConfigContext();
            tailwindConfig = getTailwindConfig({
              appDirectory,
              tailwindVersion,
              userConfig: userTailwindConfig,
              extraConfig: modernConfig?.tools?.tailwindcss,
              designSystem: modernConfig?.source?.designSystem,
            });
          }
        };

        return {
          tools: {
            // TODO: Add interface about postcss config
            // TODO: In module project, also is called, but should not be called.
            postcss: (config: Record<string, any>) => {
              initTailwindConfig();

              const tailwindPlugin = require(tailwindPath)(tailwindConfig);
              if (Array.isArray(config.postcssOptions.plugins)) {
                config.postcssOptions.plugins.push(tailwindPlugin);
              } else {
                config.postcssOptions.plugins = [tailwindPlugin];
              }
            },

            babel: haveTwinMacro
              ? (_, { addPlugins }) => {
                  const supportCssInJsLibrary = 'styled-components';
                  initTailwindConfig();
                  addPlugins([
                    [
                      require.resolve('babel-plugin-macros'),
                      {
                        twin: {
                          preset: supportCssInJsLibrary,
                          config: internalTwConfigPath || tailwindConfig,
                        },
                      },
                    ],
                  ]);
                }
              : undefined,
          },
        };
      },

      beforeBuildTask(config) {
        const modernConfig =
          api.useResolvedConfigContext() as NormalizedConfig<ModuleTools>;
        const tailwindConfig = getTailwindConfig({
          appDirectory,
          tailwindVersion,
          userConfig: userTailwindConfig,
          extraConfig: config.style.tailwindcss,
          designSystem: modernConfig.designSystem,
        });

        const tailwindPlugin = require(tailwindPath)(tailwindConfig);
        if (Array.isArray(config.style.postcss.plugins)) {
          config.style.postcss.plugins.push(tailwindPlugin);
        } else {
          config.style.postcss.plugins = [tailwindPlugin];
        }

        config.transformCache = false;

        return config;
      },
    };
  },
});

export default tailwindcssPlugin;
