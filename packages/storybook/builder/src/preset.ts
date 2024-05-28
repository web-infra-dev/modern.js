import { join, resolve } from 'path';
import type { Options } from '@storybook/types';
import type { UniBuilderConfig } from '@modern-js/uni-builder';
import { STORYBOOK_CONFIG_ENTRY } from './utils';

export const previewMainTemplate = () => {
  return require.resolve('@modern-js/storybook-builder/templates/preview.ejs');
};

function getStoriesConfigPath(cwd: string) {
  return resolve(join(cwd, STORYBOOK_CONFIG_ENTRY));
}

export const entries = async (_: unknown) => {
  const result: string[] = [];

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
