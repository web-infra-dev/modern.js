import { Import, PLUGIN_SCHEMAS } from '@modern-js/utils';
import { getTailwindConfig } from './tailwind';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);

export default core.createPlugin(
  () => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-tailwind'];
    },
    config() {
      return {
        tools: {
          // TODO: add interface about postcss config
          postcss: (config: Record<string, any>) => {
            const { value: modernConfig } = core.useResolvedConfigContext();
            const tailwindConfig = getTailwindConfig(modernConfig, {});
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
      const { value: modernConfig } = core.useResolvedConfigContext();
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
  { name: '@modern-js/plugin-tailwind' },
) as any;
