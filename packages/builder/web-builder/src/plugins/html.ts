import path from 'path';
import { DEFAULT_MOUNT_ID, HTML_DIST_DIR } from '../shared';
import type { BuilderConfig, BuilderPlugin, HTMLPluginOptions } from '../types';

async function getFilename(entry: string, config: BuilderConfig) {
  const { removeLeadingSlash } = await import('@modern-js/utils');
  const { distPath } = config.output || {};

  const htmlPath =
    (typeof distPath === 'object' && distPath.html) || HTML_DIST_DIR;

  const filename = config.html?.disableHtmlFolder
    ? `${entry}.html`
    : `${entry}/index.html`;

  return removeLeadingSlash(`${htmlPath}/${filename}`);
}

function getMinify(isProd: boolean, config: BuilderConfig) {
  if (config.output?.disableMinimize || !isProd) {
    return false;
  }

  // these options are same as the default options of html-webpack-plugin
  return {
    removeComments: true,
    useShortDoctype: true,
    keepClosingSlash: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
  };
}

function getTitle(entry: string, config: BuilderConfig) {
  const { title, titleByEntries } = config.html || {};
  return titleByEntries?.[entry] || title || '';
}

function getInject(entry: string, config: BuilderConfig) {
  const { inject, injectByEntries } = config.html || {};
  return injectByEntries?.[entry] || inject || true;
}

async function getMetaTags(entry: string, config: BuilderConfig) {
  const { generateMetaTags } = await import('@modern-js/utils');
  const { meta, metaByEntries } = config.html || {};

  const metaOptions = metaByEntries?.[entry] || meta;
  return metaOptions ? generateMetaTags(metaOptions) : '';
}

async function getTemplateParameters(
  entry: string,
  config: BuilderConfig,
  publicPath: string,
): Promise<HTMLPluginOptions['templateParameters']> {
  const { mountId, templateParameters, templateParametersByEntries } =
    config.html || {};

  const meta = await getMetaTags(entry, config);
  const title = getTitle(entry, config);

  const baseParameters = {
    meta,
    title,
    mountId: mountId || DEFAULT_MOUNT_ID,
    entryName: entry,
    publicPath,
    ...(templateParametersByEntries?.[entry] || templateParameters),
  };

  // refer to: https://github.com/jantimon/html-webpack-plugin/blob/main/examples/template-parameters/webpack.config.js
  return (compilation, assets, assetTags, pluginOptions) => ({
    compilation,
    webpackConfig: compilation.options,
    htmlWebpackPlugin: {
      tags: assetTags,
      files: assets,
      options: pluginOptions,
    },
    ...baseParameters,
  });
}

function getTemplatePath() {
  const DEFAULT_TEMPLATE = path.resolve(
    __dirname,
    '../../static/template.html',
  );

  return DEFAULT_TEMPLATE;
}

export const PluginHtml = (): BuilderPlugin => ({
  name: 'web-builder-plugin-html',

  setup(api) {
    api.modifyWebpackChain(async (chain, { isProd, CHAIN_ID }) => {
      const { default: HtmlWebpackPlugin } = await import(
        'html-webpack-plugin'
      );
      const { removeTailSlash } = await import('@modern-js/utils');

      const config = api.getBuilderConfig();
      const entries = Object.keys(chain.entryPoints.entries());
      const publicPath = removeTailSlash(chain.output.get('publicPath'));

      await Promise.all(
        entries.map(async entry => {
          const inject = getInject(entry, config);
          const minify = getMinify(isProd, config);
          const filename = await getFilename(entry, config);
          const template = getTemplatePath();
          const templateParameters = await getTemplateParameters(
            entry,
            config,
            publicPath,
          );

          chain
            .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entry}`)
            .use(HtmlWebpackPlugin, [
              {
                inject,
                minify,
                filename,
                template,
                templateParameters,
              },
            ]);
        }),
      );
    });
  },
});
