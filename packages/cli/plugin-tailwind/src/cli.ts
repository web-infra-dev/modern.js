import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import DesignTokenPlugin from '@modern-js/plugin-design-token/cli';
import type { CliPlugin } from '@modern-js/core';
import { getTailwindConfig } from './tailwind';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-tailwindcss',

  // support designSystem.supportStyledComponents
  usePlugins: [DesignTokenPlugin()],

  setup: api => ({
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
  }),
});
