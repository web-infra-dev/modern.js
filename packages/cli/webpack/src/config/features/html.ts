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
import type { HtmlTagObject } from 'html-webpack-plugin';
// import { DocumentContext } from '@modern-js/runtime/document';
import { BottomTemplatePlugin } from '../../plugins/bottom-template-plugin';
import { ICON_EXTENSIONS } from '../../utils/constants';
import type { ChainUtils } from '../shared';

// todo: 移入常量文件中
const DOCUMENT_FILE_NAME = 'document';
const DOCUMENT_OUTPUT_NAME = 'document';
const DOCUMENT_SCRIPTS_PLACEHOLDER = '&lt;!-- chunk scripts --/&gt;';
const docExt = ['jsx', 'tsx'];

function isExistedDocument(appDir: string): boolean {
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

function getDocumenByEntryName(
  appDir: string,
  entryName: string,
): string | undefined {
  // tofix: 自定义 Entry 场景下，存在 entryName 与 路径对不上的可能
  const docRelativePath = entryName === 'main' ? '' : entryName;

  const docFileExt = docExt.find(item => {
    const documentFilePath = `${appDir}/src/${docRelativePath}/${DOCUMENT_FILE_NAME}.${item}`;
    return findExists([documentFilePath]);
  });

  if (!docFileExt) {
    return undefined;
  }
  return `${appDir}/src/${docRelativePath}/${DOCUMENT_FILE_NAME}.${docFileExt}`;
}

function getDocParams(
  appContext: IAppContext,
  baseTemplateParams: Record<string, any>,
) {
  return {
    // todo: 补充更多参数
    // a: appContext.ip, // 举例
    ...baseTemplateParams,
  };
}

export async function applyHTMLPlugin({
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
    let hasCustomerScripts = true;
    let html = '';
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

    // 查找该 entry 下 document 文件
    let documentFilePath = getDocumenByEntryName(appdir, entryName);

    if (isUseDocument) {
      // entry 下无 document.tsx 文件，则用 main 的兜底
      if (!documentFilePath) {
        documentFilePath = getDocumenByEntryName(appdir, 'main');
      }
    }
    chain
      .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`)
      .use(HtmlWebpackPlugin, [
        {
          __internal__: true, // flag for internal html-webpack-plugin usage
          filename: htmlFilename(entryName),
          chunks: [entryName],
          // 应该替换这里的模板
          template: appContext.htmlTemplates[entryName],
          minify: false,
          templateContent: async ({ htmlWebpackPlugin }) => {
            const tmpDir = path.join(
              appdir,
              'node_modules/.modern-js/document',
            );
            const outputTmpPath = `${tmpDir}/${entryName}_${DOCUMENT_OUTPUT_NAME}.js`;
            // 编译 Document 文件
            await build({
              entryPoints: [documentFilePath!],
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
            const documentParams = getDocParams(appContext, baseTemplateParams);
            // 5.2 给 Document 注入参数
            // 5.3 render html 文件
            // const DocumentContext = React.createContext<{ [x: string]: any }>({});
            html = ReactDomServer.renderToString(
              // React.createElement(
              //   DocumentContext.Provider,
              //   { value: { ...documentParams } },
              React.createElement(Document, documentParams),
              // ),
            );
            hasCustomerScripts = new RegExp(DOCUMENT_SCRIPTS_PLACEHOLDER).test(
              html,
            );
            // todo: scripts 的替换等
            const scripts =
              // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
              htmlWebpackPlugin.tags.headTags
                .filter((item: HtmlTagObject) => item.tagName === 'script')
                .join('') + htmlWebpackPlugin.tags.bodyTags.toString();

            return html.replace(DOCUMENT_SCRIPTS_PLACEHOLDER, scripts);
            // todo: 返回 jupiter 原始 html
            // return `<html><body>没有匹配到</body></html>`;
          },
          baseTemplateParams,
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
          inject: hasCustomerScripts
            ? false
            : getEntryOptions(
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
