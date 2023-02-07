import {
  isHtmlDisabled,
  applyBuilderHtmlPlugin,
} from '@modern-js/builder-shared';
import type { BuilderPlugin, BuilderPluginAPI } from '../types';
import type { Options as HtmlTagsPluginOptions } from '../webpackPlugins/HtmlTagsPlugin';
import _ from '@modern-js/utils/lodash';

export const applyInjectTags = (api: BuilderPluginAPI) => {
  api.modifyWebpackChain(async (chain, { HtmlWebpackPlugin, CHAIN_ID }) => {
    const config = api.getNormalizedConfig();
    const tags = _.castArray(config.html.tags).filter(Boolean);
    const tagsByEntries = _.mapValues(config.html.tagsByEntries, tags =>
      _.castArray(tags).filter(Boolean),
    );
    const shouldByEntries = _.some(tagsByEntries, 'length');

    // skip if options is empty.
    if (!tags.length && !shouldByEntries) {
      return;
    }
    // dynamic import.
    const { HtmlTagsPlugin } = await import('../webpackPlugins/HtmlTagsPlugin');
    // create shared options used for entry without specified options.
    const sharedOptions: HtmlTagsPluginOptions = {
      htmlWebpackPlugin: HtmlWebpackPlugin,
      append: true,
      hash: false,
      publicPath: true,
      tags,
    };
    // apply only one webpack plugin if `html.tagsByEntries` is empty.
    if (tags.length && !shouldByEntries) {
      chain
        .plugin(CHAIN_ID.PLUGIN.HTML_TAGS)
        .use(HtmlTagsPlugin, [sharedOptions]);
      return;
    }
    // apply webpack plugin for each entries.
    for (const [entry, filename] of Object.entries(api.getHTMLPaths())) {
      const opts = { ...sharedOptions, includes: [filename] };
      entry in tagsByEntries && (opts.tags = tagsByEntries[entry]);
      chain
        .plugin(`${CHAIN_ID.PLUGIN.HTML_TAGS}#${entry}`)
        .use(HtmlTagsPlugin, [opts]);
    }
  });
};

export const builderPluginHtml = (): BuilderPlugin => ({
  name: 'builder-plugin-html',

  setup(api) {
    applyBuilderHtmlPlugin(api, {
      async getHtmlAppIconPlugin() {
        const { HtmlAppIconPlugin } = await import(
          '../webpackPlugins/HtmlAppIconPlugin'
        );
        return HtmlAppIconPlugin;
      },
      async getHtmlCrossOriginPlugin() {
        const { HtmlCrossOriginPlugin } = await import(
          '../webpackPlugins/HtmlCrossOriginPlugin'
        );
        return HtmlCrossOriginPlugin;
      },
      async getHtmlBundlerPlugin() {
        const { default: HtmlWebpackPlugin } = await import(
          'html-webpack-plugin'
        );
        return HtmlWebpackPlugin;
      },
    });

    api.modifyWebpackChain(async (chain, { target }) => {
      const config = api.getNormalizedConfig();

      // if html is disabled or target is server, skip html plugin
      if (isHtmlDisabled(config, target)) {
        return;
      }

      if (config.html) {
        const { crossorigin } = config.html;

        if (crossorigin) {
          const formattedCrossorigin =
            crossorigin === true ? 'anonymous' : crossorigin;

          chain.output.crossOriginLoading(formattedCrossorigin);
        }
      }
    });

    applyInjectTags(api);
  },
});
