import path from 'path';
import {
  PLUGIN_SCHEMAS,
  fs,
  CONFIG_CACHE_DIR,
  globby,
  nanoid,
  slash,
  deleteRequireCache,
} from '@modern-js/utils';
import type { LegacyAppTools, NormalizedConfig } from '@modern-js/app-tools';
import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import designTokenPlugin from './design-token/cli';
import { getTailwindConfig } from './tailwind';
import {
  template,
  checkTwinMacroExist,
  getTailwindPath,
  getTailwindVersion,
  getTwinMacroMajorVersion,
} from './utils';

const supportCssInJsLibrary = 'styled-components';

export const getRandomTwConfigFileName = (internalDirectory: string) => {
  return slash(
    path.join(
      internalDirectory,
      `tailwind.config.${Date.now()}.${nanoid()}.js`,
    ),
  );
};

export default (
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

    const defaultContent = [
      './config/html/**/*.html',
      './config/html/**/*.ejs',
      './config/html/**/*.hbs',
      './src/**/*.js',
      './src/**/*.jsx',
      './src/**/*.ts',
      './src/**/*.tsx',
      // about storybook
      './storybook/**/*',
    ];

    return {
      prepare() {
        if (!haveTwinMacro) {
          return;
        }

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
      },

      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-tailwindcss'];
      },

      config() {
        return {
          tools: {
            // TODO: Add interface about postcss config
            // TODO: In module project, also is called, but should not be called.
            postcss: (config: Record<string, any>) => {
              const modernConfig = api.useResolvedConfigContext();
              const tailwindConfig = getTailwindConfig(
                tailwindVersion,
                modernConfig?.tools?.tailwindcss,
                modernConfig?.source?.designSystem,
                {
                  pureConfig: {
                    content: defaultContent,
                  },
                },
              );

              const tailwindPlugin = require(tailwindPath)(tailwindConfig);
              if (Array.isArray(config.postcssOptions.plugins)) {
                config.postcssOptions.plugins.push(tailwindPlugin);
              } else {
                config.postcssOptions.plugins = [tailwindPlugin];
              }
            },

            babel(_, { addPlugins }) {
              if (haveTwinMacro) {
                // twin.macro >= v3.0.0 support config object
                // twin.macro < v3.0.0 only support config path
                // https://github.com/ben-rogerson/twin.macro/releases/tag/3.0.0
                const twinMajorVersion = getTwinMacroMajorVersion(appDirectory);
                const supportConfigObject =
                  twinMajorVersion && twinMajorVersion >= 3;

                let twinConfig: string | Record<string, unknown> =
                  internalTwConfigPath;

                if (supportConfigObject) {
                  twinConfig = require(internalTwConfigPath);

                  // Webpack will check require history for persistent cache.
                  // If webpack can not resolve the file, the previous cache pack will become invalid.
                  // The config file is temporary, so we should clear the require history to avoid breaking the webpack cache.
                  deleteRequireCache(internalTwConfigPath);
                }

                addPlugins([
                  [
                    require.resolve('babel-plugin-macros'),
                    {
                      twin: {
                        preset: supportCssInJsLibrary,
                        config: twinConfig,
                      },
                    },
                  ],
                ]);
              }
            },
          },
        };
      },

      beforeBuildTask(config) {
        const modernConfig =
          api.useResolvedConfigContext() as NormalizedConfig<ModuleTools>;
        const { designSystem } = modernConfig;
        const tailwindConfig = getTailwindConfig(
          tailwindVersion,
          config.style.tailwindCss,
          designSystem,
          {
            pureConfig: {
              content: defaultContent,
            },
          },
        );

        const tailwindPlugin = require(tailwindPath)(tailwindConfig);
        if (Array.isArray(config.style.postcss.plugins)) {
          config.style.postcss.plugins.push(tailwindPlugin);
        } else {
          config.style.postcss.plugins = [tailwindPlugin];
        }

        return config;
      },
    };
  },
});
