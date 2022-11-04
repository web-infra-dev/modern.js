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
import React from 'react';
import ReactDomServer from 'react-dom/server';
import type { Entrypoint, IAppContext } from '@modern-js/types';
import { template as lodashTemplate } from '@modern-js/utils/lodash';
import type { HtmlTagObject } from 'html-webpack-plugin';
import { DocumentContext } from '@modern-js/runtime/document';
import { BottomTemplatePlugin } from '../../plugins/bottom-template-plugin';
import { ICON_EXTENSIONS } from '../../utils/constants';
import type { ChainUtils } from '../shared';

// todo: 移入常量文件中
const DOCUMENT_FILE_NAME = 'document';
const DOCUMENT_SCRIPTS_PLACEHOLDER = encodeURIComponent(
  '<!-- chunk scripts placeholder -->',
);
const DOCUMENT_META_PLACEHOLDER = encodeURIComponent('<%= meta %>');
const DOCUMENT_NO_SCRIPTE_PLACEHOLDER =
  encodeURIComponent('<!-- no-script -->');
const PLACEHOLDER_MAP = {
  [DOCUMENT_NO_SCRIPTE_PLACEHOLDER]: `We're sorry but react app doesn't work properly without JavaScript enabled. Please enable it to continue.`,
};

const docExt = ['jsx', 'tsx'];

function getDocumenByEntryName(
  entrypoints: Entrypoint[],
  entryName: string,
): string | undefined {
  const entryDir = entrypoints.find(
    item => item.entryName === entryName,
  )?.absoluteEntryDir;

  const docFile = findExists(
    docExt.map(item => `${entryDir}/${DOCUMENT_FILE_NAME}.${item}`),
  );

  return docFile || undefined;
}

function getDocParams(
  appContext: IAppContext,
  config: any,
  baseTemplateParams: Record<string, any>,
) {
  // 返回给 _document 组件调用的参数
  // 保持兼容和足够的信息，分为：process, config, templateParams
  return {
    processEnv: process.env,
    config: config.output,
    templateParams: baseTemplateParams,
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
      metaOrigin: getEntryOptions(
        entryName,
        config.output.meta,
        config.output.metaByEntries,
        packageName,
      ),
      ...getEntryOptions<Record<string, unknown> | undefined>(
        entryName,
        config.output.templateParameters,
        config.output.templateParametersByEntries,
        packageName,
      ),
    };

    // 查找该 entry 下 document 文件
    let documentFilePath = getDocumenByEntryName(
      appContext.entrypoints,
      entryName,
    );

    // entry 下无 document.tsx 文件，则用 main 的兜底
    if (!documentFilePath) {
      documentFilePath = getDocumenByEntryName(appContext.entrypoints, 'main');
    }

    const htmlTemplateWithDoc = documentFilePath
      ? {
          inject: documentFilePath
            ? false
            : getEntryOptions(
                entryName,
                config.output.inject,
                config.output.injectByEntries,
                packageName,
              ),
          templateContent: async ({
            htmlWebpackPlugin,
          }: {
            [option: string]: any;
          }) => {
            const Document = (await import(`${documentFilePath}`)).default;
            // 获取注入参数
            const documentParams = getDocParams(
              appContext,
              config,
              baseTemplateParams,
            );
            // 拼装 html 组件
            const HTMLElement = React.createElement(
              DocumentContext.Provider,
              { value: documentParams },
              React.createElement(Document, null),
            );
            // 转成 string
            const html = ReactDomServer.renderToString(HTMLElement);

            const scripts =
              // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
              htmlWebpackPlugin.tags.headTags
                .filter((item: HtmlTagObject) => item.tagName === 'script')
                .join('') + htmlWebpackPlugin.tags.bodyTags.toString();

            // 替换 html 占位符（因为 string 转成 jsx 比较麻烦。所以，使用占位符 + 替换的方式）
            // - 替换元素：meta、scripts
            return `<!DOCTYPE html>${html}`
              .replace(DOCUMENT_META_PLACEHOLDER, baseTemplateParams.meta)
              .replace(DOCUMENT_SCRIPTS_PLACEHOLDER, scripts)
              .replace(
                DOCUMENT_NO_SCRIPTE_PLACEHOLDER,
                PLACEHOLDER_MAP[DOCUMENT_NO_SCRIPTE_PLACEHOLDER],
              );
          },
        }
      : null;

    chain
      .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`)
      .use(HtmlWebpackPlugin, [
        {
          __internal__: true, // flag for internal html-webpack-plugin usage
          filename: htmlFilename(entryName),
          chunks: [entryName],
          template: appContext.htmlTemplates[entryName],
          ...htmlTemplateWithDoc,
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
