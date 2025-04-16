import type { AppTools, CliPluginFuture } from '@modern-js/app-tools';
import {
  type PluginImageOptions as BuilderPluginImageOptions,
  pluginImage as builderPluginImage,
} from '@rsbuild-image/core';

export interface ImagePluginOptions extends BuilderPluginImageOptions {}

export const imagePlugin = (
  options: ImagePluginOptions = {},
): CliPluginFuture<AppTools<'shared'>> => ({
  name: '@modern-js/image',
  setup: api => {
    const { ...builderPluginOptions } = options;
    builderPluginOptions.ipx ||= {};
    builderPluginOptions.ipx.basename ||= '/_modern/ipx';

    api.config(() => ({
      builderPlugins: [builderPluginImage(builderPluginOptions)],
    }));
  },
});

export default imagePlugin;
