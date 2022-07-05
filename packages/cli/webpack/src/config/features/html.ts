import path from 'path';
import {
  isProd,
  CHAIN_ID,
  findExists,
  getEntryOptions,
  removeTailSlash,
  generateMetaTags,
} from '@modern-js/utils';
import webpack from 'webpack';
import type { Entrypoint, IAppContext } from '@modern-js/types';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import { BottomTemplatePlugin } from '../../plugins/bottom-template-plugin';
import { ICON_EXTENSIONS } from '../../utils/constants';
import type { ChainUtils } from '../shared';

export function applyHTMLPlugin({
  chain,
  config,
  appContext,
  htmlFilename,
}: ChainUtils & {
  htmlFilename: (name: string) => string;
}) {
  const { packageName } = appContext as IAppContext & {
    entrypoints: Entrypoint[];
  };

  const HtmlWebpackPlugin: typeof import('html-webpack-plugin') = require('html-webpack-plugin');

  // output html files
  const entrypoints = Object.keys(chain.entryPoints.entries() || {});
  for (const entryName of entrypoints) {
    const baseTemplateParams = {
      entryName,
      title: getEntryOptions<string | undefined>(
        entryName,
        config.output.title,
        config.output.titleByEntries,
        packageName,
      ),
      mountId: config.output.mountId!,
      assetPrefix: removeTailSlash(chain.output.get('publicPath')),
      meta: generateMetaTags(
        getEntryOptions(
          entryName,
          config.output.meta,
          config.output.metaByEntries,
          packageName,
        ),
      ),
      ...getEntryOptions<Record<string, unknown> | undefined>(
        entryName,
        config.output.templateParameters,
        config.output.templateParametersByEntries,
        packageName,
      ),
    };

    chain
      .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`)
      .use(HtmlWebpackPlugin, [
        {
          __internal__: true, // flag for internal html-webpack-plugin usage
          filename: htmlFilename(entryName),
          chunks: [entryName],
          template: appContext.htmlTemplates[entryName],
          minify: !isProd()
            ? false
            : {
                collapseWhitespace: true,
                removeComments: false,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
              },
          favicon:
            getEntryOptions<string | undefined>(
              entryName,
              config.output.favicon,
              config.output.faviconByEntries,
              packageName,
            ) ||
            findExists(
              ICON_EXTENSIONS.map(ext =>
                path.resolve(
                  appContext.appDirectory,
                  config.source.configDir!,
                  `favicon.${ext}`,
                ),
              ),
            ),
          inject: getEntryOptions(
            entryName,
            config.output.inject,
            config.output.injectByEntries,
            packageName,
          ),
          templateParameters: (
            compilation: webpack.Compilation,
            assets,
            assetTags,
            pluginOptions,
          ) => ({
            webpackConfig: compilation.options,
            htmlWebpackPlugin: {
              tags: assetTags,
              files: assets,
              options: pluginOptions,
            },
            ...baseTemplateParams,
          }),
          bottomTemplate:
            appContext.htmlTemplates[`__${entryName}-bottom__`] &&
            lodashTemplate(appContext.htmlTemplates[`__${entryName}-bottom__`])(
              baseTemplateParams,
            ),
        },
      ]);
  }

  chain
    .plugin(CHAIN_ID.PLUGIN.BOTTOM_TEMPLATE)
    .use(BottomTemplatePlugin, [HtmlWebpackPlugin]);
}
