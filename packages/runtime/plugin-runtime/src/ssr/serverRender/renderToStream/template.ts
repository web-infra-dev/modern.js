import fs from 'fs';
import type { ServerStyleSheet } from 'styled-components';
import type { ChunkExtractor } from '@loadable/server';
import { RuntimeContext, ModernSSRReactComponent } from '../types';
import { getLoadableScripts } from '../utils';
import { getLoadableChunks } from './loadable';
import { getStyledComponentCss } from './styledComponent';
import { buildAfterEntryTemplate } from './buildTemplate.after_entry';
import { buildBeforeEntryTemplate } from './bulidTemplate.before_entry';
import { InjectTemplate } from './type';

const HTML_SEPARATOR = '<!--<?- html ?>-->';
const filesCache = new Map<string, string>();

export function createTemplates(
  context: RuntimeContext,
  rootElement: React.ReactElement,
  prefetchData: Record<string, any>,
  App: ModernSSRReactComponent,
) {
  const {
    jsx,
    chunkExtractor,
    styleSheet,
  }: {
    context?: RuntimeContext;
    jsx: React.ReactElement;
    chunkExtractor?: ChunkExtractor;
    styleSheet?: ServerStyleSheet;
  } = [getStyledComponentCss, getLoadableChunks].reduce(
    (params, handler) => {
      return {
        ...(params || {}),
        ...handler({
          jsx: params.jsx,
          context: params.context,
        }),
      };
    },
    {
      context,
      jsx: rootElement,
    },
  );
  const getTemplates: () => InjectTemplate = () => {
    const filepath = context.ssrContext!.template;
    const fileContent = getFileContent(filepath);
    const [beforeEntryTemplate = '', afterEntryHtmlTemplate = ''] =
      fileContent?.split(HTML_SEPARATOR) || [];
    const loadableChunks =
      chunkExtractor?.getChunkAssets(chunkExtractor.chunks) || [];
    const loadableScripts = getLoadableScripts(chunkExtractor!);
    const styledComponentCSS = styleSheet?.getStyleTags() || '';
    const builedBeforeTemplate = buildBeforeEntryTemplate(beforeEntryTemplate, {
      loadableChunks,
      styledComponentCSS,
    });
    const buildedAfterTemplate = buildAfterEntryTemplate(
      afterEntryHtmlTemplate,
      {
        loadableScripts,
        loadableChunks,
        App,
        context,
        prefetchData,
      },
    );
    return {
      beforeEntry: builedBeforeTemplate,
      afterEntry: buildedAfterTemplate,
    };
  };

  return {
    jsx,
    getTemplates,
  };

  /**
   * get file's content from cache
   * @param filepath
   * @returns
   */
  function getFileContent(filepath = '') {
    if (filesCache.has(filepath)) {
      return filesCache.get(filepath);
    }
    const fileContent = fs.existsSync(filepath)
      ? fs.readFileSync(filepath, 'utf-8')
      : '';
    if (fileContent) {
      filesCache.set(filepath, fileContent);
    }
    return fileContent;
  }
}
