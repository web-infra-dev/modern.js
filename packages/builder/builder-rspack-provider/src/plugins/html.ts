import { applyBuilderHtmlPlugin } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const builderPluginHtml = (): BuilderPlugin => ({
  name: 'builder-plugin-html',

  setup(api) {
    applyBuilderHtmlPlugin(api, {
      async getHtmlAppIconPlugin() {
        const { HtmlAppIconPlugin } = await import(
          '../rspackPlugins/HtmlAppIconPlugin'
        );
        return HtmlAppIconPlugin;
      },
      async getHtmlCrossOriginPlugin() {
        const { HtmlCrossOriginPlugin } = await import(
          '../rspackPlugins/HtmlCrossOriginPlugin'
        );
        return HtmlCrossOriginPlugin;
      },
      async getHtmlBundlerPlugin() {
        const { default: HtmlBundlerPlugin } = await import(
          '@rspack/plugin-html'
        );
        return HtmlBundlerPlugin;
      },
    });
  },
});
