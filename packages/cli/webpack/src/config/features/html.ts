import path from 'path';
import {
  // isProd,
  CHAIN_ID,
  findExists,
  getEntryOptions,
  removeTailSlash,
  generateMetaTags,
} from '@modern-js/utils';
import webpack from 'webpack';
// import React from 'react';
// import ReactDomServer from 'react-dom/server';
import { build } from 'esbuild';
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
          minify: false,
          templateContent: async () => {
            // console.log('===> \n template: ', htmlWebpackPlugin);
            // 1. 获取 rootDir
            // 2. 获取 docuemnt 文件 & 判断要渲染哪些 document 文件
            // 3. 拼接成 html 文件，返回
            const appdir = path.resolve(appContext.appDirectory);
            // todo: entryName 加入
            const docFileIn = ['src/document'];
            const docExt = ['.jsx', '.tsx'];

            // 查找逻辑 | 全部 html 文件
            const docFiles = docFileIn.reduce((sum, file) => {
              for (const ext of docExt) {
                const validateFile = path.join(
                  appdir,
                  `${[file, ext].join('')}`,
                );
                if (findExists([validateFile])) {
                  sum.push(validateFile);
                  break;
                }
              }
              return sum;
            }, [] as string[]);

            // 编译 Document 文件
            // console.log('\n\n===> esbuild params:\n', appdir, docFiles);
            const res = await build({
              entryNames: docFiles[0],
              // outdir: path.join(appdir, '.tmp', 'document.js'),
              outfile: `${appdir}/document.js`,
              platform: 'node',
              bundle: true,
            });
            // eslint-disable-next-line no-console
            console.log('\n\n\n===>  res: \n', res);
            // const { Document } = await import(`${appdir}/d.js`);
            // // console.log('===> Document: \n', Document);
            // const html = ReactDomServer.renderToString(
            //   React.createElement(Document, null),
            // );

            // console.log('\n\n\n===> html string: \n:', html);

            return `<html>
              <head></head>
              'hello'
            </html>`;
            // return d.replace('sorry', 'chli');
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
            // refer to: https://github.com/jantimon/html-webpack-plugin/blob/main/examples/template-parameters/webpack.config.js
            compilation,
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
