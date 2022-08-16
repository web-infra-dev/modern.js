import path from 'path';
import { HTML_DIST_DIR } from '../shared';
import type { BuilderConfig, BuilderPlugin } from '../types';

function getFilename(entry: string, config: BuilderConfig) {
  const { distPath } = config.output || {};

  const htmlPath =
    (typeof distPath === 'object' && distPath.html) || HTML_DIST_DIR;

  const filename = config.output?.disableHtmlFolder
    ? `${entry}.html`
    : `${entry}/index.html`;

  return `${htmlPath}/${filename}`;
}

function getMinifyOptions(isProd: boolean, config: BuilderConfig) {
  if (config.output?.disableMinimize || !isProd) {
    return false;
  }

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

function getTemplateParameters() {
  return {
    meta: '',
    title: '',
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

      entries.forEach(entry => {
        chain
          .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entry}`)
          .use(HtmlWebpackPlugin, [
            {
              minify: getMinifyOptions(isProd, config),
              template: DEFAULT_TEMPLATE,
              filename: getFilename(entry, config),
              templateParameters: getTemplateParameters(),
            },
          ]);
      });
    });
  },
});
