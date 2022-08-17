import { applyOptionsChain } from '@modern-js/utils';
import path from 'path';
import { getDistPath, DEFAULT_MOUNT_ID } from '../shared';
import type {
  BuilderConfig,
  BuilderPlugin,
  WebpackConfig,
  HTMLPluginOptions,
} from '../types';

async function getFilename(entryName: string, config: BuilderConfig) {
  const { removeLeadingSlash } = await import('@modern-js/utils');
  const htmlPath = getDistPath(config, 'html');
  const filename = config.html?.disableHtmlFolder
    ? `${entryName}.html`
    : `${entryName}/index.html`;

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

function getTitle(entryName: string, config: BuilderConfig) {
  const { title, titleByEntries } = config.html || {};
  return titleByEntries?.[entryName] || title || '';
}

function getInject(entryName: string, config: BuilderConfig) {
  const { inject, injectByEntries } = config.html || {};
  return injectByEntries?.[entryName] || inject || true;
}

function getFavicon(entryName: string, config: BuilderConfig) {
  const { favicon, faviconByEntries } = config.html || {};
  return faviconByEntries?.[entryName] || favicon;
}

async function getMetaTags(entryName: string, config: BuilderConfig) {
  const { generateMetaTags } = await import('@modern-js/utils');
  const { meta, metaByEntries } = config.html || {};

  const metaOptions = metaByEntries?.[entryName] || meta;
  return metaOptions ? generateMetaTags(metaOptions) : '';
}

async function getTemplateParameters(
  entryName: string,
  config: BuilderConfig,
  assetPrefix: string,
): Promise<HTMLPluginOptions['templateParameters']> {
  const { mountId, templateParameters, templateParametersByEntries } =
    config.html || {};

  const meta = await getMetaTags(entryName, config);
  const title = getTitle(entryName, config);

  const baseParameters = {
    meta,
    title,
    mountId: mountId || DEFAULT_MOUNT_ID,
    entryName,
    assetPrefix,
    ...(templateParametersByEntries?.[entryName] || templateParameters),
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
  entryName: string,
  entryValue: WebpackConfig['entry'],
) {
  const { isPlainObject } = await import('@modern-js/utils');
  const dependOn = [];

  if (isPlainObject(entryValue)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error assume entry is an entry object
    dependOn.push(...entryValue.dependOn);
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
      const assetPrefix = removeTailSlash(chain.output.get('publicPath') || '');
      const entries = chain.entryPoints.entries();
      const entryNames = Object.keys(chain.entryPoints.entries());

      await Promise.all(
        entryNames.map(async entryName => {
          const entryValue = entries[entryName].values();
          const chunks = await getChunks(entryName, entryValue);
          const inject = getInject(entryName, config);
          const favicon = getFavicon(entryName, config);
          const filename = await getFilename(entryName, config);
          const templateParameters = await getTemplateParameters(
            entryName,
            config,
            assetPrefix,
          );

          const pluginOptions = {
            chunks,
            inject,
            minify,
            favicon,
            filename,
            template,
            templateParameters,
          };

          const finalOptions = applyOptionsChain(
            pluginOptions,
            config.tools?.htmlPlugin,
            {
              entryName,
              entryValue,
            },
          );

          chain
            .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`)
            .use(HtmlWebpackPlugin, [finalOptions]);
        }),
      );
    });
  },
});
