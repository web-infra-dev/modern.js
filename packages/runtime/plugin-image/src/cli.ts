import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import {
  type PluginImageOptions as BuilderPluginImageOptions,
  pluginImage as builderPluginImage,
} from '@rsbuild-image/core';

export interface ImagePluginOptions extends BuilderPluginImageOptions {
  ipx?: BuilderPluginImageOptions['ipx'] & {
    /**
     * @deprecated Use `assetPrefix` instead.
     */
    basename?: string;
  };
}

export const imagePlugin = (
  options: ImagePluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/image',
  setup: api => {
    const { ipx: { basename, ...ipx } = {}, ...rest } = options;
    const builderPluginOptions: BuilderPluginImageOptions = {
      ...rest,
      ipx: {
        ...ipx,
        assetPrefix: ipx.assetPrefix || basename || '/_modern/ipx',
      },
    };

    api.config(() => ({
      builderPlugins: [builderPluginImage(builderPluginOptions) as any],
    }));
  },
});

export default imagePlugin;
