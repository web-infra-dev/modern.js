import path from 'path';
import {
  PLUGIN_SCHEMAS,
  fs,
  CONFIG_CACHE_DIR,
  globby,
  nanoid,
} from '@modern-js/utils';
import DesignTokenPlugin from '@modern-js/plugin-design-token/cli';
import type { CliPlugin } from '@modern-js/core';
import { getTailwindConfig } from './tailwind';

const supportCssInJsLibrary = 'styled-components';

export const getRandomTwConfigFileName = (internalDirectory: string) => {
  return `${internalDirectory}/tailwind.config.${Date.now()}.${nanoid()}.js`;
};

export default (): CliPlugin => ({
  name: '@modern-js/plugin-tailwindcss',

  // support designSystem.supportStyledComponents
  usePlugins: [DesignTokenPlugin()],

  setup: api => {
    const { appDirectory, internalDirectory } = api.useAppContext();
    let internalTwConfigPath = '';

    return {
      prepare() {
        internalTwConfigPath = getRandomTwConfigFileName(internalDirectory);
        const files = globby.sync(`${appDirectory}/${CONFIG_CACHE_DIR}/*.cjs`, {
          absolute: true,
        });
        if (files.length > 0) {
          fs.writeFileSync(
            internalTwConfigPath,
            `
          const modernConfig = require('${path.join(files[0])}').default;
          const theme = modernConfig
            && modernConfig.source
            && modernConfig.source.designSystem
            ? modernConfig.source.designSystem : {};
          const tailwindcss = modernConfig
            && modernConfig.tools
            && modernConfig.tools.tailwindcss
            ? modernConfig.tools.tailwindcss : {};

          if (process.env.DEBUG) {
            console.info(JSON.stringify(modernConfig));
          }

          module.exports = {
            theme,
            ...tailwindcss,
         };
          `,
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
                    pluginTarget.includes('compiled/babel-plugin-macros')
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
