import path from 'path';
import {
  PLUGIN_SCHEMAS,
  fs,
  CONFIG_CACHE_DIR,
  globby,
  nanoid,
  slash,
} from '@modern-js/utils';
import DesignTokenPlugin from '@modern-js/plugin-design-token/cli';
import type { CliPlugin } from '@modern-js/core';
import { getTailwindConfig } from './tailwind';
import { template, checkTwinMacroNotExist } from './utils';

const supportCssInJsLibrary = 'styled-components';

export const getRandomTwConfigFileName = (internalDirectory: string) => {
  return slash(
    path.join(
      internalDirectory,
      `tailwind.config.${Date.now()}.${nanoid()}.js`,
    ),
  );
};

export default (): CliPlugin => ({
  name: '@modern-js/plugin-tailwindcss',

  // support designSystem.supportStyledComponents
  usePlugins: [DesignTokenPlugin()],

  setup: async api => {
    const { appDirectory, internalDirectory } = api.useAppContext();
    let internalTwConfigPath = '';
    // When reinstalling dependencies, most of the time the project will be restarted
    const notHaveTwinMacro = await checkTwinMacroNotExist(appDirectory);

    return {
      prepare() {
        if (notHaveTwinMacro) {
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
              const tailwindConfig = getTailwindConfig(modernConfig, {
                pureConfig: {
                  content: [
                    './config/html/**/*.html',
                    './config/html/**/*.ejs',
                    './config/html/**/*.hbs',
                    './src/**/*.js',
                    './src/**/*.jsx',
                    './src/**/*.ts',
                    './src/**/*.tsx',
                    // about storybook
                    './storybook/**/*',
                    './styles/**/*.less',
                    './styles/**/*.css',
                    './styles/**/*.sass',
                    './styles/**/*.scss',
                  ],
                },
              });
              if (Array.isArray(config.postcssOptions.plugins)) {
                config.postcssOptions.plugins.push(
                  require('tailwindcss')(tailwindConfig),
                );
              } else {
                config.postcssOptions.plugins = [
                  require('tailwindcss')(tailwindConfig),
                ];
              }
            },
            babel(config) {
              if (notHaveTwinMacro) {
                return;
              }
              const twinConfig = {
                twin: {
                  preset: supportCssInJsLibrary,
                  config: internalTwConfigPath,
                },
              };
              config.plugins?.some(plugin => {
                if (Array.isArray(plugin) && plugin[0]) {
                  const pluginTarget = plugin[0];
                  let pluginOptions = plugin[1];
                  if (
                    typeof pluginTarget === 'string' &&
                    // TODO: use babel chain
                    slash(pluginTarget).includes('compiled/babel-plugin-macros')
                  ) {
                    if (pluginOptions) {
                      pluginOptions = {
                        ...pluginOptions,
                        ...twinConfig,
                      };
                    } else {
                      plugin.push(twinConfig);
                    }

                    return true;
                  }
                }

                return false;
              });
            },
          },
        };
      },

      moduleTailwindConfig() {
        const modernConfig = api.useResolvedConfigContext();
        const tailwindConfig = getTailwindConfig(modernConfig, {
          pureConfig: {
            content: [
              './src/**/*.js',
              './src/**/*.jsx',
              './src/**/*.ts',
              './src/**/*.tsx',
              './src/**/*.less',
              './src/**/*.css',
              './src/**/*.sass',
              './src/**/*.scss',
              './styles/**/*.less',
              './styles/**/*.css',
              './styles/**/*.sass',
              './styles/**/*.scss',
            ],
          },
        });
        return require('tailwindcss')(tailwindConfig);
      },
    };
  },
});
