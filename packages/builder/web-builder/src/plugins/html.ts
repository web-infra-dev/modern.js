import path from 'path';
import { HTML_DIST_DIR } from '../shared';
import type { BuilderConfig, BuilderPlugin } from '../types';

async function getFilename(entry: string, config: BuilderConfig) {
  const { removeLeadingSlash } = await import('@modern-js/utils');
  const { distPath } = config.output || {};

  const htmlPath =
    (typeof distPath === 'object' && distPath.html) || HTML_DIST_DIR;

  const filename = config.output?.disableHtmlFolder
    ? `${entry}.html`
    : `${entry}/index.html`;

  return removeLeadingSlash(`${htmlPath}/${filename}`);
}

function getMinifyOptions(isProd: boolean, config: BuilderConfig) {
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
  const { title, titleByEntries } = config.output || {};
  return titleByEntries?.[entry] || title || '';
}

function getTemplateParameters(entry: string, config: BuilderConfig) {
  return {
    meta: '',
    title: getTitle(entry, config),
  };
}

export const PluginHtml = (): BuilderPlugin => ({
  name: 'web-builder-plugin-html',

  setup(api) {
    api.modifyWebpackChain(async (chain, { isProd, CHAIN_ID }) => {
      const DEFAULT_TEMPLATE = path.resolve(
        __dirname,
        '../../static/template.html',
      );

      const { default: HtmlWebpackPlugin } = await import(
        'html-webpack-plugin'
      );

      const config = api.getBuilderConfig();
      const entries = Object.keys(chain.entryPoints.entries());

      await Promise.all(
        entries.map(async entry => {
          const minify = getMinifyOptions(isProd, config);
          const filename = await getFilename(entry, config);
          const templateParameters = getTemplateParameters(entry, config);

          chain
            .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entry}`)
            .use(HtmlWebpackPlugin, [
              {
                minify,
                filename,
                template: DEFAULT_TEMPLATE,
                templateParameters,
              },
            ]);
        }),
      );
    });
  },
});
