import path from 'path';
import React from 'react';
import ReactDomServer from 'react-dom/server';
import { build } from 'esbuild';
import type { CliPlugin, UserConfig } from '@modern-js/core';
import { createDebugger, findExists } from '@modern-js/utils';
import { Entrypoint } from '@modern-js/types/cli';

import {
  DOCUMENT_SCRIPTS_PLACEHOLDER,
  DOCUMENT_FILE_NAME,
  DOCUMENT_META_PLACEHOLDER,
  DOCUMENT_NO_SCRIPTE_PLACEHOLDER,
  PLACEHOLDER_REPLACER_MAP,
  DOC_EXT,
  DOCUMENT_SSR_PLACEHOLDER,
  DOCUMENT_CHUNKSMAP_PLACEHOLDER,
  DOCUMENT_SSRDATASCRIPT_PLACEHOLDER,
  HTML_SEPARATOR,
} from './constants';
import { DocumentContext } from './DocumentContext';

const debug = createDebugger('html_genarate');

const getDocumenByEntryName = function (
  entrypoints: Entrypoint[],
  entryName: string,
): string | undefined {
  const entryDir = entrypoints.find(
    item => item.entryName === entryName,
  )?.absoluteEntryDir;

  const docFile = findExists(
    DOC_EXT.map(item => `${entryDir}${path.sep}${DOCUMENT_FILE_NAME}.${item}`),
  );

  return docFile || undefined;
};

export default (): CliPlugin => ({
  name: '@modern-js/document',
  pre: ['@modern-js/plugin-analyze'],
  setup: async api => {
    // 获取给 document 组件调用的参数
    function getDocParams(params: {
      config: UserConfig;
      entryName: string;
      templateParameters: Record<string, unknown>;
    }) {
      const { config, templateParameters, entryName } = params;
      // 保持兼容和足够的信息，分为：process, config, templateParams
      return {
        processEnv: process.env,
        config: {
          output: config.output,
        },
        entryName,
        templateParams: templateParameters,
      };
    }
    const documentEntry = (
      entryName: string,
      // config: HtmlPluginConfig,
      templateParameters: Record<string, unknown>,
    ) => {
      const { entrypoints, internalDirectory } = api.useAppContext();
      // 查找 entry 下 document 文件
      //  若 entry 下无 document.tsx 文件，则用 main 的兜底
      let documentFilePath = getDocumenByEntryName(entrypoints, entryName);
      if (!documentFilePath) {
        documentFilePath = getDocumenByEntryName(entrypoints, 'main');
      }
      // if no document file, do nothing as default
      if (!documentFilePath) {
        return null;
      }

      return async ({ htmlWebpackPlugin }: { [option: string]: any }) => {
        // 获取注入参数
        const documentParams = getDocParams({
          config: api.useConfigContext(),
          entryName,
          templateParameters,
        });
        const htmlOutputFile = path.join(
          internalDirectory,
          `./document/_${entryName}.html.js`,
        );
        // 将 document 文件转成 html string
        await build({
          entryPoints: [documentFilePath!],
          // write: false,
          outfile: htmlOutputFile,
          platform: 'node',
          target: 'es6',
          loader: {
            '.ts': 'ts',
            '.tsx': 'tsx',
          },
          bundle: true,
          plugins: [
            {
              name: 'make-all-packages-external',
              setup(build) {
                // https://github.com/evanw/esbuild/issues/619#issuecomment-751995294
                build.onResolve(
                  { filter: /^[^./]|^\.[^./]|^\.\.[^/]/ },
                  args => {
                    let external = true;
                    // FIXME: windows external entrypoint
                    if (args.kind === 'entry-point') {
                      external = false;
                    }
                    return {
                      path: args.path,
                      external,
                    };
                  },
                );
              },
            },
          ],
        });

        const Document = (await import(htmlOutputFile)).default;

        const HTMLElement = React.createElement(
          DocumentContext.Provider,
          { value: documentParams },
          React.createElement(Document, null),
        );
        const html = ReactDomServer.renderToString(HTMLElement);

        debug("entry %s's document jsx rendered html: %o", entryName, html);

        const scripts = [
          htmlWebpackPlugin.tags.headTags
            .filter((item: any) => item.tagName === 'script')
            .join(''),
          htmlWebpackPlugin.tags.bodyTags.toString(),
        ].join('');

        const metas = [
          templateParameters.meta,
          htmlWebpackPlugin.tags.headTags
            .filter((item: any) => item.tagName !== 'script')
            .join(''),
        ].join('');

        // 替换 html 占位符（因为 string 转成 jsx 比较麻烦。所以，使用占位符 + 替换的方式）
        return `<!DOCTYPE html>${html}`
          .replace(DOCUMENT_META_PLACEHOLDER, metas)
          .replace(DOCUMENT_SSR_PLACEHOLDER, HTML_SEPARATOR)
          .replace(DOCUMENT_SCRIPTS_PLACEHOLDER, scripts)
          .replace(
            DOCUMENT_NO_SCRIPTE_PLACEHOLDER,
            PLACEHOLDER_REPLACER_MAP[DOCUMENT_NO_SCRIPTE_PLACEHOLDER],
          )
          .replace(
            DOCUMENT_CHUNKSMAP_PLACEHOLDER,
            PLACEHOLDER_REPLACER_MAP[DOCUMENT_CHUNKSMAP_PLACEHOLDER],
          )
          .replace(
            DOCUMENT_SSRDATASCRIPT_PLACEHOLDER,
            PLACEHOLDER_REPLACER_MAP[DOCUMENT_SSRDATASCRIPT_PLACEHOLDER],
          );
      };
    };
    return {
      config: () => {
        return {
          tools: {
            htmlPlugin: (options, entry) => {
              // just for reuse the baseParames calculate by builder:
              // https://github.com/modern-js-dev/modern.js/blob/1abb452a87ae1adbcf8da47d62c05da39cbe4d69/packages/builder/builder-webpack-provider/src/plugins/html.ts#L69-L103
              const hackParameters: Record<string, unknown> =
                typeof options?.templateParameters === 'function'
                  ? options?.templateParameters(
                      {} as any,
                      {} as any,
                      {} as any,
                      {} as any,
                    )
                  : { ...options?.templateParameters };

              const templateContent = documentEntry(
                entry.entryName,
                // options,
                hackParameters,
              );

              const documentHtmlOptions = templateContent
                ? {
                    templateContent,
                    inject: false,
                  }
                : {};

              return {
                ...options,
                ...documentHtmlOptions,
              };
            },
          },
        };
      },
    };
  },
});
