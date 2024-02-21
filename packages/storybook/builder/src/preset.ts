import { join, resolve } from 'path';
import type { Options } from '@storybook/types';
import type { UniBuilderConfig } from '@modern-js/uni-builder';
import { getConfig } from './build';
import { STORYBOOK_CONFIG_ENTRY } from './utils';

export const previewMainTemplate = () => {
  return require.resolve('@modern-js/storybook-builder/templates/preview.ejs');
};

function getStoriesConfigPath(cwd: string) {
  return resolve(join(cwd, STORYBOOK_CONFIG_ENTRY));
}

export const entries = async (_: unknown, options: Options) => {
  const result: string[] = [];
  const { bundler } = await getConfig(options);

  if (options.configType === 'DEVELOPMENT') {
    // Suppress informational messages when --quiet is specified. webpack-hot-middleware's quiet
    // parameter would also suppress warnings.
    result.push(
      ...([
        `${require.resolve(
          'webpack-hot-middleware/client',
        )}?reload=true&quiet=false&noInfo=${options.quiet}`,

        bundler === 'rspack'
          ? require.resolve('@rspack/plugin-react-refresh/react-refresh-entry')
          : null,
      ].filter(Boolean) as string[]),
    );
  }

  result.push(getStoriesConfigPath(process.cwd()));

  return result;
};

export const modern = (
  builderConfig: UniBuilderConfig,
  options: Options,
): UniBuilderConfig => {
  return {
    ...builderConfig,
    // modern plugin can't be used as Rsbuild plugin
    plugins: [],

    output: {
      ...builderConfig.output,
      disableInlineRuntimeChunk: true,
      distPath: {
        ...builderConfig.output?.distPath,
        root: options.outputDir,
      },
    },
  };
};
