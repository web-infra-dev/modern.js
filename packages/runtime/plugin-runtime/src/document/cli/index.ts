import path from 'path';
import React from 'react';
import ReactDomServer from 'react-dom/server';
import { build } from 'esbuild';
import type { AppUserConfig, CliPlugin, AppTools } from '@modern-js/app-tools';
import { createDebugger, findExists } from '@modern-js/utils';
import { Entrypoint } from '@modern-js/types/cli';

import { DocumentContext } from '../DocumentContext';
import {
  DOCUMENT_SCRIPTS_PLACEHOLDER,
  DOCUMENT_FILE_NAME,
  DOCUMENT_META_PLACEHOLDER,
  PLACEHOLDER_REPLACER_MAP,
  DOC_EXT,
  DOCUMENT_SSR_PLACEHOLDER,
  DOCUMENT_CHUNKSMAP_PLACEHOLDER,
  DOCUMENT_SSRDATASCRIPT_PLACEHOLDER,
  HTML_SEPARATOR,
} from '../constants';

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

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-document',
  pre: ['@modern-js/plugin-analyze'],
  setup: async api => {
    // get params for document.tsx
    function getDocParams(params: {
      config: AppUserConfig;
      entryName: string;
      templateParameters: Record<string, unknown>;
    }) {
      const { config, templateParameters, entryName } = params;
      // for enough params, devide as：process, config, templateParams
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
      // search the document.[tsx|jsx|js|ts] under entry
      // if not, use main as default
      let documentFilePath = getDocumenByEntryName(entrypoints, entryName);
      if (!documentFilePath) {
        documentFilePath = getDocumenByEntryName(entrypoints, 'main');
      }
      // if no document file, do nothing as default
      if (!documentFilePath) {
        return null;
      }

      return async ({ htmlWebpackPlugin }: { [option: string]: any }) => {
        const documentParams = getDocParams({
          config: api.useConfigContext(),
          entryName,
          templateParameters,
        });
        const htmlOutputFile = path.join(
          internalDirectory,
          `./document/_${entryName}.html.js`,
        );
        // transform document file to html string
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
        const html = ReactDomServer.renderToStaticMarkup(HTMLElement);

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

        // replace the html placeholder while transfer string to jsx component is not a easy way
        return `<!DOCTYPE html>${html}`
          .replace(DOCUMENT_META_PLACEHOLDER, metas)
          .replace(DOCUMENT_SSR_PLACEHOLDER, HTML_SEPARATOR)
          .replace(DOCUMENT_SCRIPTS_PLACEHOLDER, scripts)
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
