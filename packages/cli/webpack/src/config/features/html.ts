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
import React from 'react';
import ReactDomServer from 'react-dom/server';
import { build } from 'esbuild';
import type { Entrypoint, IAppContext } from '@modern-js/types';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import { BottomTemplatePlugin } from '../../plugins/bottom-template-plugin';
import { ICON_EXTENSIONS } from '../../utils/constants';
import type { ChainUtils } from '../shared';

// todo: 移入常量文件中
const DOCUMENT_FILE_NAME = 'document';
const DOCUMENT_OUTPUT_NAME = 'document';

function isExistedDocument(appDir: string): boolean {
  const docExt = ['jsx', 'tsx'];

  const docFileExt = docExt.find(ext => {
    const validateFile = path.join(
      `${appDir}/src/${DOCUMENT_FILE_NAME}.${ext}`,
    );
    if (findExists([validateFile])) {
      return true;
    }
    return false;
  });

  return docFileExt !== undefined;
}

function getDirByEntryName(appDir: string, entryName: string) {
  if (entryName === 'main') {
    return path.join(appDir, 'src');
  }
  return path.join(appDir, 'src', entryName);
}

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
  const appdir = path.resolve(appContext.appDirectory);

  // output html files
  const isUseDocument = isExistedDocument(appdir);
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
            // 2. 由 appContext.entrypoints 获取文件所在位置
            // 3. 拼接成 html 文件，返回
            // todo: entryName 加入

            const docExt = ['jsx', 'tsx'];
            // 查找该 entry 下 document 文件
            const documentDir = getDirByEntryName(appdir, entryName);

            let docFileExt = docExt.find(item => {
              const validateFile = path.join(
                `${documentDir}/${DOCUMENT_FILE_NAME}.${item}`,
              );
              if (findExists([validateFile])) {
                return true;
              }
              return false;
            });

            // todo: 无 docFileExt 时使用
            if (isUseDocument) {
              //  todo: entry 下无 document.tsx 文件，则用 main 的兜底
              if (!docFileExt) {
                docFileExt = 'main';
              }
              const documentFilePath = path.join(
                documentDir,
                `${DOCUMENT_FILE_NAME}.${docFileExt}`,
              );
              // 编译 Document 文件
              const tmpDir = path.join(
                appdir,
                'node_modules/.modern-js/document',
              );
              const outputTmpPath = `${tmpDir}/${entryName}_${DOCUMENT_OUTPUT_NAME}.js`;
              await build({
                entryPoints: [documentFilePath],
                outfile: outputTmpPath,
                platform: 'node',
                target: 'es6',
                loader: {
                  '.ts': 'ts',
                  '.tsx': 'tsx',
                },
                jsx: 'transform',
                bundle: true,
              });

              const { Document } = await require(`${outputTmpPath}`);
              // 5.2 给 Document 注入参数
              // 5.3 render html 文件
              const html = ReactDomServer.renderToString(
                React.createElement(Document, null),
              );

              return `${html}`;
            }
            // todo: 返回 jupiter 原始 html
            return `<html><body>没有匹配到</body></html.`;
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
