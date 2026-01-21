import Module from 'module';
import { builtinModules } from 'module';
import path from 'path';
import type {
  AppTools,
  CliPlugin,
  AppNormalizedConfig as NormalizedConfig,
} from '@modern-js/app-tools';
import type { Entrypoint } from '@modern-js/types/cli';
import { fs, createDebugger, findExists } from '@modern-js/utils';
import type { Rspack, RspackChain } from '@rsbuild/core';
import { decodeHTML } from 'entities';

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

interface DocumentParams {
  processEnv: NodeJS.ProcessEnv;
  config: {
    output: NormalizedConfig['output'];
  };
  entryName: string;
  templateParams: Record<string, unknown>;
}

interface PartialsContent {
  partialsTop: string;
  partialsHead: string;
  partialsBody: string;
}

interface HtmlWebpackPluginTags {
  headTags: Array<{ tagName: string; toString(): string }>;
  bodyTags: { toString(): string };
}

interface HtmlWebpackPlugin {
  tags: HtmlWebpackPluginTags;
}

interface ExternalRequest {
  request?: string;
}

type Compiler = Rspack.Compiler;
type Compilation = Rspack.Compilation;

const debug = createDebugger('document');

const entryName2DocCode = new Map<string, string>();

const CONSTANTS = {
  GLOBAL_DOC_RENDERERS: '__MODERN_DOC_RENDERERS__',
  DOCUMENT_OUTPUT_DIR: 'document',
  TEMP_ENTRY_PREFIX: '_entry_',
  HTML_OUTPUT_PREFIX: '_',
  HTML_OUTPUT_SUFFIX: '.html.js',
  CHILD_COMPILER_PREFIX: 'modernjs-document-',
  COMMONJS_EXTERNAL_PREFIX: 'commonjs ',
  NODE_PREFIX: 'node:',
} as const;

const EXTERNAL_MAPPINGS = {
  react: 'react',
  'react/jsx-runtime': 'react/jsx-runtime',
  'react/jsx-dev-runtime': 'react/jsx-dev-runtime',
  'react-dom/server': 'react-dom/server',
} as const;

// global stores helpers
// Because Bundler will build IFEE, the components and renderers need to be stored on global.
const getGlobalDocRenderers = () => {
  const g = globalThis as any;
  g[CONSTANTS.GLOBAL_DOC_RENDERERS] = g[CONSTANTS.GLOBAL_DOC_RENDERERS] || {};
  return g[CONSTANTS.GLOBAL_DOC_RENDERERS] as Record<
    string,
    (p: DocumentParams) => string
  >;
};

// clear cached renderer to support HMR for Document.tsx
const clearGlobalDocRenderer = (entryName: string): void => {
  const renderers = getGlobalDocRenderers();
  if (renderers[entryName]) {
    delete renderers[entryName];
  }
};

const decodeHtmlEntities = (input: string): string => decodeHTML(input);

const isWindowsAbs = (req: string): boolean => /^[a-zA-Z]:[\\/]/.test(req);
const isRelativeOrAbs = (req: string): boolean =>
  req.startsWith('.') || req.startsWith('/') || isWindowsAbs(req);
const isAsset = (req: string): boolean =>
  /\.(css|less|scss|sass|styl|png|jpe?g|gif|svg|ico|woff2?|ttf|eot)(?:[?#].*)?$/.test(
    req,
  );

const processScriptPlaceholders = (html: string, nonce?: string): string => {
  if (
    !html.includes(DOCUMENT_SCRIPT_PLACEHOLDER_START) ||
    !html.includes(DOCUMENT_SCRIPT_PLACEHOLDER_END)
  ) {
    return html;
  }

  const nonceAttr = nonce ? `nonce="${nonce}"` : '';
  return html.replace(
    new RegExp(
      `${DOCUMENT_SCRIPT_PLACEHOLDER_START}${DOCUMENT_SCRIPT_ATTRIBUTES_START}([\\s\\S]*?)${DOCUMENT_SCRIPT_ATTRIBUTES_END}([\\s\\S]*?)${DOCUMENT_SCRIPT_PLACEHOLDER_END}`,
      'g',
    ),
    (_scriptStr: string, $1: string, $2: string) =>
      `<script ${decodeURIComponent($1)} ${nonceAttr}>${decodeHtmlEntities(decodeURIComponent($2))}</script>`,
  );
};

const processStylePlaceholders = (html: string): string => {
  if (
    !html.includes(DOCUMENT_STYLE_PLACEHOLDER_START) ||
    !html.includes(DOCUMENT_STYLE_PLACEHOLDER_END)
  ) {
    return html;
  }

  return html.replace(
    new RegExp(
      `${DOCUMENT_STYLE_PLACEHOLDER_START}([\\s\\S]*?)${DOCUMENT_STYLE_PLACEHOLDER_END}`,
      'g',
    ),
    (_styleStr: string, $1: string) =>
      `<style>${decodeHtmlEntities(decodeURIComponent($1))}</style>`,
  );
};

const processCommentPlaceholders = (html: string): string => {
  if (
    !html.includes(DOCUMENT_COMMENT_PLACEHOLDER_START) ||
    !html.includes(DOCUMENT_COMMENT_PLACEHOLDER_END)
  ) {
    return html;
  }

  return html.replace(
    new RegExp(
      `${DOCUMENT_COMMENT_PLACEHOLDER_START}([\\s\\S]*?)${DOCUMENT_COMMENT_PLACEHOLDER_END}`,
      'g',
    ),
    (_scriptStr: string, $1: string) =>
      `${decodeHtmlEntities(decodeURIComponent($1))}`,
  );
};

// load CommonJS module from code string (evaluated in Node), returns exports
const requireFromString = (code: string, filename: string) => {
  const m = new Module.Module(filename, module.parent as Module);
  m.filename = filename;
  // set proper resolution paths for nested requires
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore private API used intentionally
  m.paths = Module.Module._nodeModulePaths(path.dirname(filename));
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore private API _compile
  m._compile(code, filename);
  return m.exports;
};

export const getDocumentByEntryName = function (
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

// external node buildin modules
const createExternalHandler =
  () =>
  ({ request }: ExternalRequest) => {
    const req = request || '';
    if (isAsset(req)) return;
    if (req.startsWith(CONSTANTS.NODE_PREFIX)) {
      return `${CONSTANTS.COMMONJS_EXTERNAL_PREFIX}${req}`;
    }
    if (builtinModules.includes(req)) {
      return `${CONSTANTS.COMMONJS_EXTERNAL_PREFIX}${req}`;
    }
    if (isRelativeOrAbs(req)) return;
    return;
  };

const configureChildCompiler = (
  child: Compiler,
  compiler: Compiler,
  appDirectory: string,
) => {
  child.options.mode = compiler.options.mode;
  child.options.target = 'node';
  child.options.context = compiler.options.context || appDirectory;
  child.options.resolve = {
    ...compiler.options.resolve,
    fallback: {},
  };
  child.options.module = compiler.options.module;
  child.options.externalsPresets = { node: true };
  child.options.devtool = false;
};

const applyExternalsPlugin = (child: Compiler, compiler: Compiler) => {
  const ExternalsPlugin = compiler.rspack?.ExternalsPlugin;
  if (ExternalsPlugin) {
    new ExternalsPlugin('commonjs', [
      createExternalHandler(),
      EXTERNAL_MAPPINGS,
    ]).apply(child);
  }
};

const generateEntryCode = (docPath: string, _entryName: string): string => {
  return `var React = require('react');
var ReactDomServer = require('react-dom/server');
var exp = require(${JSON.stringify(docPath)});
var DocumentContext = require('@meta/runtime/document').DocumentContext;

var Document = exp && exp.default;

// expose to global for host to consume
var g = (typeof globalThis !== 'undefined' ? globalThis : global);
g.__MODERN_DOC_RENDERERS__ = g.__MODERN_DOC_RENDERERS__ || {};

function render(documentParams) {
  var HTMLElement = React.createElement(
    DocumentContext.Provider,
    { value: documentParams },
    React.createElement(Document, null)
  );
  return ReactDomServer.renderToStaticMarkup(HTMLElement);
}

g.__MODERN_DOC_RENDERERS__[${JSON.stringify(_entryName)}] = render;

module.exports = { render: render };`;
};

const processChildCompilation = async (
  entryName: string,
  docPath: string,
  compilation: Compilation,
  compiler: Compiler,
  appDirectory: string,
  internalDirectory: string,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const outFile = path.posix.join(
      CONSTANTS.DOCUMENT_OUTPUT_DIR,
      `${CONSTANTS.HTML_OUTPUT_PREFIX}${entryName}${CONSTANTS.HTML_OUTPUT_SUFFIX}`,
    );

    const child = compilation.createChildCompiler(
      `${CONSTANTS.CHILD_COMPILER_PREFIX}${entryName}`,
      {
        filename: outFile,
        library: { type: 'commonjs2' },
      },
      [],
    );

    configureChildCompiler(child, compiler, appDirectory);
    // external react related dependencies
    applyExternalsPlugin(child, compiler);

    const entryDir = path.join(
      internalDirectory,
      CONSTANTS.DOCUMENT_OUTPUT_DIR,
    );
    const tempEntry = path.join(
      entryDir,
      `${CONSTANTS.TEMP_ENTRY_PREFIX}${entryName}.js`,
    );

    const finalize = () => {
      try {
        const EntryPlugin = compiler.rspack?.EntryPlugin;
        if (!EntryPlugin) {
          throw new Error('EntryPlugin not available');
        }

        new EntryPlugin(compiler.context, tempEntry, {
          name: `${CONSTANTS.CHILD_COMPILER_PREFIX}${entryName}`,
        }).apply(child);

        child.runAsChild(
          (
            err?: Error | null,
            _entries?: any,
            childCompilation?: Compilation,
          ) => {
            if (err) return reject(err);
            try {
              if (!childCompilation) {
                throw new Error('Child compilation is undefined');
              }
              const asset =
                childCompilation.assets[outFile] ||
                childCompilation.getAsset?.(outFile)?.source;
              const code: string =
                typeof asset?.source === 'function'
                  ? asset.source().toString()
                  : typeof asset === 'string'
                    ? asset
                    : asset?.buffer?.().toString?.() || '';

              if (!code) {
                debug('Document child compiler: empty asset for %s', entryName);
              } else {
                entryName2DocCode.set(entryName, code);
                debug(
                  'Document child compiler: cached injected bundle for %s',
                  entryName,
                );
              }
              resolve();
            } catch (e) {
              reject(e as Error);
            }
          },
        );
      } catch (e) {
        reject(e as Error);
      }
    };

    try {
      fs.ensureFile(tempEntry)
        .then(() => {
          const entryCode = generateEntryCode(docPath, entryName);
          return fs.writeFile(tempEntry, entryCode);
        })
        .then(finalize)
        .catch((e: unknown) => reject(e as Error));
    } catch (e) {
      reject(e as Error);
    }
  });
};

export const documentPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-document',

  pre: ['@modern-js/plugin-analyze'],
  setup: async api => {
    class ModernJsDocumentChildCompilerPlugin {
      name = 'ModernJsDocumentChildCompilerPlugin';

      apply(compiler: Compiler) {
        compiler.hooks.make.tapPromise(
          this.name,
          async (compilation: Compilation) => {
            try {
              const { entrypoints, appDirectory, internalDirectory } =
                api.getAppContext();
              const tasks: Promise<void>[] = [];

              for (const ep of entrypoints || []) {
                const entryName = ep.entryName;
                const docPath = getDocumentByEntryName(
                  entrypoints!,
                  entryName,
                  appDirectory,
                );
                if (!docPath) continue;

                // ensure host compiler watches Document file for HMR
                compilation.fileDependencies?.add?.(docPath);

                // clear cached renderer so updated Document takes effect
                clearGlobalDocRenderer(entryName);

                tasks.push(
                  processChildCompilation(
                    entryName,
                    docPath,
                    compilation,
                    compiler,
                    appDirectory,
                    internalDirectory,
                  ),
                );
              }
              await Promise.all(tasks);
            } catch (e) {
              debug('Document child compiler make hook failed: %o', e);
            }
          },
        );
      }
    }

    api.config(() => {
      const documentPath = path.join(__dirname, '..', 'index.mjs');
      return {
        resolve: {
          alias: {
            '@meta/runtime/document$': documentPath.replace(
              `${path.sep}cjs${path.sep}`,
              `${path.sep}esm${path.sep}`,
            ),
          },
        },
        tools: {
          bundlerChain: (chain: RspackChain) => {
            chain
              .plugin('modernjs-document-child-compiler')
              .use(ModernJsDocumentChildCompilerPlugin, []);
          },
        },
      };
    });

    const getDocParams = (params: {
      config: NormalizedConfig;
      entryName: string;
      templateParameters: Record<string, unknown>;
    }): DocumentParams => {
      const { config, templateParameters, entryName } = params;
      return {
        processEnv: process.env,
        config: {
          output: config.output,
        },
        entryName,
        templateParams: templateParameters,
      };
    };

    const loadRender = async (
      entryName: string,
      internalDirectory: string,
    ): Promise<{ renderer?: (p: DocumentParams) => string }> => {
      const renderers = getGlobalDocRenderers();
      const globalRenderer = renderers[entryName];
      if (globalRenderer) {
        return { renderer: globalRenderer };
      }

      const cached = entryName2DocCode.get(entryName);
      if (!cached) {
        throw new Error(
          `Failed to load Document bundle for entry "${entryName}". This is likely because the Document component compilation failed or the bundle was not generated correctly. Please check your Document component implementation.`,
        );
      }

      const filename = path.join(
        internalDirectory,
        `./${CONSTANTS.DOCUMENT_OUTPUT_DIR}/${CONSTANTS.HTML_OUTPUT_PREFIX}${entryName}${CONSTANTS.HTML_OUTPUT_SUFFIX}`,
      );

      requireFromString(cached, filename);

      return { renderer: renderers[entryName] };
    };

    const processPartials = (
      html: string,
      entryName: string,
      partialsByEntrypoint: Record<
        string,
        { top: string[]; head: string[]; body: string[] }
      >,
    ): string => {
      const partialsContent: PartialsContent = {
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

      return html
        .replace(TOP_PARTICALS_SEPARATOR, () => partialsContent.partialsTop)
        .replace(HEAD_PARTICALS_SEPARATOR, () => partialsContent.partialsHead)
        .replace(BODY_PARTICALS_SEPARATOR, () => partialsContent.partialsBody);
    };

    const extractHtmlTags = (
      htmlWebpackPlugin: HtmlWebpackPlugin,
      templateParameters: Record<string, unknown>,
    ) => {
      const scripts = [
        htmlWebpackPlugin.tags.headTags
          .filter(item => item.tagName === 'script')
          .join(''),
        htmlWebpackPlugin.tags.bodyTags.toString(),
      ].join('');

      const links = htmlWebpackPlugin.tags.headTags
        .filter(item => item.tagName === 'link')
        .join('');

      const metas = [
        templateParameters.meta,
        htmlWebpackPlugin.tags.headTags
          .filter(
            item =>
              item.tagName !== 'script' &&
              item.tagName !== 'link' &&
              item.tagName !== 'title',
          )
          .join(''),
      ].join('');

      const titles: string = htmlWebpackPlugin.tags.headTags
        .filter(item => item.tagName === 'title')
        .join('')
        .replace('<title>', '')
        .replace('</title>', '');

      return { scripts, links, metas, titles };
    };

    const processPlaceholders = (
      html: string,
      config: NormalizedConfig,
      scripts: string,
      links: string,
      metas: string,
      titles: string,
    ): string => {
      const { nonce } = config.security || {};

      let processedHtml = processScriptPlaceholders(html, nonce);
      processedHtml = processStylePlaceholders(processedHtml);
      processedHtml = processCommentPlaceholders(processedHtml);

      return `<!DOCTYPE html>${processedHtml}`
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
    };

    const documentEntry = (
      entryName: string,
      templateParameters: Record<string, unknown>,
    ) => {
      const { entrypoints, internalDirectory, appDirectory } =
        api.getAppContext();

      const documentFilePath = getDocumentByEntryName(
        entrypoints,
        entryName,
        appDirectory,
      );

      if (!documentFilePath) {
        return null;
      }
      // Don't know why we can't use htmlRspackPlugin, it can't get the tags.
      return async ({
        htmlWebpackPlugin,
      }: { [option: string]: HtmlWebpackPlugin }) => {
        const config = api.getNormalizedConfig();
        const documentParams = getDocParams({
          config: config as NormalizedConfig,
          entryName,
          templateParameters,
        });

        const { renderer } = await loadRender(entryName, internalDirectory);
        let html = renderer?.(documentParams) as string;

        debug("entry %s's document jsx rendered html: %o", entryName, html);

        const { partialsByEntrypoint } = api.getAppContext();
        html = processPartials(html, entryName, partialsByEntrypoint || {});
        const { scripts, links, metas, titles } = extractHtmlTags(
          htmlWebpackPlugin,
          templateParameters,
        );

        return processPlaceholders(
          html,
          config as NormalizedConfig,
          scripts,
          links,
          metas,
          titles,
        );
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
            // reuse builder's computed base parameters
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
    });
  },
});

export default documentPlugin;
