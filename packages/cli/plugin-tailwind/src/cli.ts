import { Import, PLUGIN_SCHEMAS } from '@modern-js/utils';
import { getTailwindConfig } from './tailwind';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);

export default core.createPlugin(
  () => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-tailwindcss'];
    },
    config() {
      return {
        tools: {
          // TODO: Add interface about postcss config
          // TODO: In module project, also is called, but should not be called.
          postcss: (config: Record<string, any>) => {
            const modernConfig = core.useResolvedConfigContext();
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
      const modernConfig = core.useResolvedConfigContext();
      const tailwindConfig = getTailwindConfig(modernConfig, {
        pureConfig: {
          content: [
            './src/**/*.js',
            './src/**/*.jsx',
            './src/**/*.ts',
            './src/**/*.tsx',
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
  { name: '@modern-js/plugin-tailwindcss' },
) as any;
