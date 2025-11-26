import path from 'path';
import type {
  AppTools,
  CliPluginFuture,
  NormalizedConfig,
} from '@modern-js/app-tools';
import type { Entrypoint } from '@modern-js/types/cli';
import { fs, createDebugger, findExists } from '@modern-js/utils';
import { build } from 'esbuild';
import React from 'react';
import ReactDomServer from 'react-dom/server';

import { DocumentContext } from '../DocumentContext';

import {
  BODY_PARTICALS_SEPARATOR,
  DOCUMENT_CHUNKSMAP_PLACEHOLDER,
  DOCUMENT_COMMENT_PLACEHOLDER_END,
  DOCUMENT_COMMENT_PLACEHOLDER_START,
  DOCUMENT_FILE_NAME,
  DOCUMENT_LINKS_PLACEHOLDER,
  DOCUMENT_META_PLACEHOLDER,
  DOCUMENT_SCRIPTS_PLACEHOLDER,
  DOCUMENT_SCRIPT_ATTRIBUTES_END,
  DOCUMENT_SCRIPT_ATTRIBUTES_START,
  DOCUMENT_SCRIPT_PLACEHOLDER_END,
  DOCUMENT_SCRIPT_PLACEHOLDER_START,
  DOCUMENT_SSRDATASCRIPT_PLACEHOLDER,
  DOCUMENT_SSR_PLACEHOLDER,
  DOCUMENT_STYLE_PLACEHOLDER_END,
  DOCUMENT_STYLE_PLACEHOLDER_START,
  DOCUMENT_TITLE_PLACEHOLDER,
  DOC_EXT,
  HEAD_PARTICALS_SEPARATOR,
  HTML_SEPARATOR,
  PLACEHOLDER_REPLACER_MAP,
  TOP_PARTICALS_SEPARATOR,
} from '../constants';

const debug = createDebugger('html_generate');

// get the entry document file,
// if not exist, fallback to src/
export const getDocumenByEntryName = function (
  entrypoints: Entrypoint[],
  entryName: string,
  fallbackDir?: string,
): string | undefined {
  const entryDir = entrypoints.find(
    item => item.entryName === entryName,
  )?.absoluteEntryDir;

  const entryDirs = DOC_EXT.map(
    item => `${entryDir}${path.sep}${DOCUMENT_FILE_NAME}.${item}`,
  );
  const fallbackDirs = fallbackDir
    ? DOC_EXT.map(item =>
        [fallbackDir, 'src', `${DOCUMENT_FILE_NAME}.${item}`].join(path.sep),
      )
    : [];

  const docFile = findExists([...entryDirs, ...fallbackDirs]);

  return docFile || undefined;
};

export const documentPlugin = (): CliPluginFuture<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-document',

  pre: ['@modern-js/plugin-analyze'],
  setup: async api => {
    // get params for document.tsx
    function getDocParams(params: {
      config: NormalizedConfig<AppTools>;
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
      const { entrypoints, internalDirectory, appDirectory } =
        api.getAppContext();
      // search the document.[tsx|jsx|js|ts] under entry
      const documentFilePath = getDocumenByEntryName(
        entrypoints,
        entryName,
        appDirectory,
      );
      // if no document file, do nothing as default
      if (!documentFilePath) {
        return null;
      }

      return async ({ htmlWebpackPlugin }: { [option: string]: any }) => {
        const config = api.getNormalizedConfig();

        const documentParams = getDocParams({
          config: config as NormalizedConfig<AppTools>,
          entryName,
          templateParameters,
        });

        // set a temporary tsconfig file for divide the influence by project's jsx
        const tempTsConfigFile = path.join(
          internalDirectory,
          `./document/_tempTsconfig.json`,
        );
        const userTsConfigFilePath = path.join(appDirectory, 'tsconfig.json');
        let tsConfig;
        try {
          tsConfig = await require(userTsConfigFilePath);
        } catch (err) {
          tsConfig = {};
        }
        if (tsConfig?.compilerOptions) {
          tsConfig.compilerOptions.jsx = 'react-jsx';
        } else {
          tsConfig.compilerOptions = {
            jsx: 'react-jsx',
          };
        }
        fs.outputFileSync(tempTsConfigFile, JSON.stringify(tsConfig));

        const htmlOutputFile = path.join(
          internalDirectory,
          `./document/_${entryName}.html.js`,
        );
        // transform document file to html string
        await build({
          entryPoints: [documentFilePath],
          outfile: htmlOutputFile,
          platform: 'node',
          // change esbuild use the rootDir tsconfig.json as default to tempTsConfigFile
          tsconfig: tempTsConfigFile,
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

        delete require.cache[require.resolve(htmlOutputFile)];
        const Document = (await require(htmlOutputFile)).default;
        const HTMLElement = React.createElement(
          DocumentContext.Provider,
          { value: documentParams },
          React.createElement(Document, null),
        );
        let html = ReactDomServer.renderToStaticMarkup(HTMLElement);

        debug("entry %s's document jsx rendered html: %o", entryName, html);
        // htmlWebpackPlugin.tags
        const { partialsByEntrypoint } = api.getAppContext();
        const scripts = [
          htmlWebpackPlugin.tags.headTags
            .filter((item: any) => item.tagName === 'script')
            .join(''),
          htmlWebpackPlugin.tags.bodyTags.toString(),
        ].join('');
        // support partials html
        const partialsContent = {
          partialsTop: '',
          partialsHead: '',
          partialsBody: '',
        };
        if (partialsByEntrypoint?.[entryName]) {
          partialsContent.partialsTop =
            partialsByEntrypoint[entryName].top.join('\n');
          partialsContent.partialsHead =
            partialsByEntrypoint[entryName].head.join('\n');
          partialsContent.partialsBody =
            partialsByEntrypoint[entryName].body.join('\n');
        }

        html = html
          .replace(TOP_PARTICALS_SEPARATOR, () => partialsContent.partialsTop)
          .replace(HEAD_PARTICALS_SEPARATOR, () => partialsContent.partialsHead)
          .replace(
            BODY_PARTICALS_SEPARATOR,
            () => partialsContent.partialsBody,
          );

        const links = [
          htmlWebpackPlugin.tags.headTags
            .filter((item: any) => item.tagName === 'link')
            .join(''),
        ].join('');

        const metas = [
          templateParameters.meta,
          htmlWebpackPlugin.tags.headTags
            .filter(
              (item: any) =>
                item.tagName !== 'script' &&
                item.tagName !== 'link' &&
                item.tagName !== 'title',
            )
            .join(''),
        ].join('');

        const titles =
          htmlWebpackPlugin.tags.headTags
            .filter((item: any) => item.tagName === 'title')
            .join('')
            .replace('<title>', '')
            .replace('</title>', '') || templateParameters.title;

        // if the Document.tsx has a functional script, replace to convert it
        if (
          html.includes(DOCUMENT_SCRIPT_PLACEHOLDER_START) &&
          html.includes(DOCUMENT_SCRIPT_PLACEHOLDER_END)
        ) {
          const { nonce } = config.security || {};
          const nonceAttr = nonce ? `nonce=${nonce}` : '';

          html = html.replace(
            new RegExp(
              `${DOCUMENT_SCRIPT_PLACEHOLDER_START}${DOCUMENT_SCRIPT_ATTRIBUTES_START}(.*?)${DOCUMENT_SCRIPT_ATTRIBUTES_END}(.*?)${DOCUMENT_SCRIPT_PLACEHOLDER_END}`,
              'g',
            ),
            (_scriptStr, $1, $2) =>
              `<script ${decodeURIComponent($1)} ${nonceAttr}>${decodeURIComponent($2)}</script>`,
          );
        }
        // if the Document.tsx has a style, replace to convert it
        if (
          html.includes(DOCUMENT_STYLE_PLACEHOLDER_START) &&
          html.includes(DOCUMENT_STYLE_PLACEHOLDER_END)
        ) {
          html = html.replace(
            new RegExp(
              `${DOCUMENT_STYLE_PLACEHOLDER_START}(.*?)${DOCUMENT_STYLE_PLACEHOLDER_END}`,
              'g',
            ),
            (_styleStr, $1) => `<style>${decodeURIComponent($1)}</style>`,
          );
        }
        // if the Document.tsx has a comment component, replace and convert it
        if (
          html.includes(DOCUMENT_COMMENT_PLACEHOLDER_START) &&
          html.includes(DOCUMENT_COMMENT_PLACEHOLDER_END)
        ) {
          html = html.replace(
            new RegExp(
              `${DOCUMENT_COMMENT_PLACEHOLDER_START}(.*?)${DOCUMENT_COMMENT_PLACEHOLDER_END}`,
              'g',
            ),
            (_scriptStr, $1) => `${decodeURIComponent($1)}`,
          );
        }

        // replace the html placeholder while transfer string to jsx component is not a easy way
        const finalHtml = `<!DOCTYPE html>${html}`
          .replace(DOCUMENT_META_PLACEHOLDER, () => metas)
          .replace(DOCUMENT_SSR_PLACEHOLDER, () => HTML_SEPARATOR)
          .replace(DOCUMENT_SCRIPTS_PLACEHOLDER, () => scripts)
          .replace(DOCUMENT_LINKS_PLACEHOLDER, () => links)
          .replace(
            DOCUMENT_CHUNKSMAP_PLACEHOLDER,
            () => PLACEHOLDER_REPLACER_MAP[DOCUMENT_CHUNKSMAP_PLACEHOLDER],
          )
          .replace(
            DOCUMENT_SSRDATASCRIPT_PLACEHOLDER,
            () => PLACEHOLDER_REPLACER_MAP[DOCUMENT_SSRDATASCRIPT_PLACEHOLDER],
          )
          .replace(DOCUMENT_TITLE_PLACEHOLDER, () => titles);
        return finalHtml;
      };
    };

    api.config(() => {
      const userConfig = api.getConfig();

      if (userConfig.tools?.htmlPlugin === false) {
        return {};
      }

      return {
        tools: {
          htmlPlugin: (options, entry) => {
            // just for reuse the baseParames calculate by builder:
            // https://github.com/web-infra-dev/modern.js/blob/1abb452a87ae1adbcf8da47d62c05da39cbe4d69/packages/builder/builder-webpack-provider/src/plugins/html.ts#L69-L103
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
                  // Note: the behavior of inject/modify tags in afterTemplateExecution hook will not take effect
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
    });
  },
});

export default documentPlugin;
