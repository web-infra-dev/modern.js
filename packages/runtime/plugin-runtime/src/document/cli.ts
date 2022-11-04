import path from 'path';
import type { CliPlugin } from '@modern-js/core';
import { build } from 'esbuild';
import React from 'react';
import ReactDomServer from 'react-dom/server';
import { findExists } from '@modern-js/utils';
import type { HtmlTagObject } from 'html-webpack-plugin';
// import type { IAppContext } from '@modern-js/types';
import { DocumentContext } from './DocumentContext';
// import webpack from 'webpack';

// type HtmlWebpackPlugin = typeof import('html-webpack-plugin');

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
  const docRelativePath = entryName === 'main' ? '' : `/${entryName}`;

  const docFileExt = docExt.find(item => {
    const documentFilePath = `${appDir}/src${docRelativePath}/${DOCUMENT_FILE_NAME}.${item}`;
    return findExists([documentFilePath]);
  });

  if (!docFileExt) {
    return undefined;
  }

  return `${appDir}/src${docRelativePath}/${DOCUMENT_FILE_NAME}.${docFileExt}`;
}

// function isDocumenExistByEntry(appDir: string, entryName: string): boolean {
//   const docFileExt = docExt.find(ext => {
//     const validateFile = path.join(
//       `${appDir}/src/${entryName}/${DOCUMENT_FILE_NAME}.${ext}`,
//     );
//     if (findExists([validateFile])) {
//       return true;
//     }
//     return false;
//   });

//   return docFileExt !== undefined;
// }

// function getDocParams(
//   appContext: IAppContext,
//   baseTemplateParams: Record<string, any>,
// ) {
//   return {
//     // todo: 补充更多参数
//     // a: appContext.ip, // 举例
//     ...baseTemplateParams,
//   };
// }

const genDocumentHtml = async (appdir: string, entryName: string) => {
  const documentFilePath = getDocumenByEntryName(appdir, entryName);
  const tmpDir = path.join(appdir, 'node_modules/.modern-js/document');
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

  const Document = (await import(`${outputTmpPath}`)).default;
  // todo: 获取到对应的参数
  const documentParams = {};
  // 5.2 给 Document 注入参数
  // 5.3 render html 文件
  // const DocumentContext = React.createContext<{ [x: string]: any }>({});
  const html = ReactDomServer.renderToString(
    React.createElement(
      DocumentContext.Provider,
      { value: { ...documentParams } },
      React.createElement(Document, documentParams),
    ),
  );
  return html;
};

export default (): CliPlugin => ({
  name: '@modern-js/document',
  pre: ['@modern-js/plugin-analyze'],
  post: [],
  //   usePlugins: [PluginState(), PluginSSR(), PluginRouter()],
  setup: async api => {
    const appContext = api.useAppContext();
    // const { entrypoints } = appContext;
    const appdir = path.resolve(appContext.appDirectory);

    // 是否为 document 渲染
    const isUseDocument = isExistedDocument(appdir);
    // const hookRunners = api.useHookRunners();
    // hookRunners.beforeBuildHooks(webpack => {});
    return {
      // beforeDev: (webpackConfig: any) => {
      // 成功
      //   console.log('====> beforeDev: ', webpackConfig);
      // },
      // async befbeforeBuild(webpackConfig: any) {
      //   console.log('====> befbeforeBuild: ', webpackConfig);
      // },
      config() {
        return {
          tools: {
            webpackChain: (chain, { CHAIN_ID }) => {
              // 获取多个 entry
              const entries = chain.entryPoints.entries();
              Object.entries(entries).forEach(async ([entryName]) => {
                // console.log(
                //   '+===> nestedRoutesEntry: ',
                //   (entry as any).parent.store.get('context'),
                // );
                // 查找该 entry 下 document 文件
                let documentFilePath = getDocumenByEntryName(appdir, entryName);

                if (isUseDocument) {
                  // entry 下无 document.tsx 文件，则用 main 的兜底
                  if (!documentFilePath) {
                    documentFilePath = getDocumenByEntryName(appdir, 'main');
                  }
                }
                // console.log('===> entry: ', entrypoints);
                const html = await genDocumentHtml(appdir, entryName);

                // 遍历 entry 处理
                chain
                  .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`)
                  .tap(options => {
                    const htmlOption = options[0];

                    if (isUseDocument) {
                      // console.log('===> change template');
                      htmlOption.templateContent = async ({
                        htmlWebpackPlugin,
                      }: any) => {
                        // todo: scripts 的替换等
                        const scripts =
                          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                          htmlWebpackPlugin.tags.headTags
                            .filter(
                              (item: HtmlTagObject) =>
                                item.tagName === 'script',
                            )
                            .join('') +
                          htmlWebpackPlugin.tags.bodyTags.toString();
                        // console.log('+++> htl:', html);
                        return html.replace(
                          DOCUMENT_SCRIPTS_PLACEHOLDER,
                          scripts,
                        );
                      };
                      htmlOption.inject = false;
                    } else {
                      htmlOption.templateContent = async () =>
                        // {
                        //   htmlWebpackPlugin,
                        // }: any
                        {
                          return `<html><body>没有匹配22到</body></html>`;
                        };
                    }

                    return options;
                  });
              });
            },
          },
        };
      },
    };
  },
});
