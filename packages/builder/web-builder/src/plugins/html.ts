import path from 'path';
import { getDistPath, DEFAULT_MOUNT_ID } from '../shared';
import type {
  WebpackChain,
  BuilderConfig,
  BuilderPlugin,
  HTMLPluginOptions,
} from '../types';

async function getFilename(entry: string, config: BuilderConfig) {
  const { removeLeadingSlash } = await import('@modern-js/utils');
  const htmlPath = getDistPath(config, 'html');
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

function getFavicon(entry: string, config: BuilderConfig) {
  const { favicon, faviconByEntries } = config.html || {};
  return faviconByEntries?.[entry] || favicon;
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
  assetPrefix: string,
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
    assetPrefix,
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

async function getChunks(
  entryPoint: WebpackChain.EntryPoint,
  entryName: string,
) {
  const { isPlainObject } = await import('@modern-js/utils');
  const entry = entryPoint.values();
  const dependOn = [];

  if (isPlainObject(entry)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error assume entry is an entry object
    dependOn.push(...entry.dependOn);
  }

  return [...dependOn, entryName];
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
      const minify = getMinify(isProd, config);
      const template = getTemplatePath();
      const assetPrefix = removeTailSlash(chain.output.get('publicPath'));
      const entries = chain.entryPoints.entries();
      const entryNames = Object.keys(chain.entryPoints.entries());

      await Promise.all(
        entryNames.map(async entry => {
          const chunks = await getChunks(entries[entry], entry);
          const inject = getInject(entry, config);
          const favicon = getFavicon(entry, config);
          const filename = await getFilename(entry, config);
          const templateParameters = await getTemplateParameters(
            entry,
            config,
            assetPrefix,
          );

          chain
            .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entry}`)
            .use(HtmlWebpackPlugin, [
              {
                chunks,
                inject,
                minify,
                favicon,
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
