import fs from 'fs';
import { createElement } from 'react';
import { RuntimeContext } from '../../core';
import { ModernSSRReactComponent } from '../serverRender/type';
import { getLoadableChunks } from './loadable';
import { getStyledComponentCss } from './styledComponent';
import {
  buildAfterEntryTemplate,
  buildAfterLeaveTemplate,
  buildBeforeEntryTemplate,
} from './buildTemplate';
import { InjectTemplate } from './type';

const HTML_SEPARATOR = '<!--<?- html ?>-->';
const filesCache = new Map<string, string>();

export async function createTemplates(
  context: RuntimeContext,
  App: ModernSSRReactComponent,
): Promise<InjectTemplate> {
  const filepath = context.ssrContext?.template;
  const fileContent = getFileContent(filepath);
  const rootElment = createElement(App, {
    context: Object.assign(context.ssrContext || {}, {
      ssr: true,
    }),
  });

  const loadableChunks = getLoadableChunks(context, rootElment);
  const styledComponentCSS = getStyledComponentCss(context, rootElment);
  const [beforeEntryTemplate = '', afterEntryHtmlTemplate = ''] =
    fileContent?.split(HTML_SEPARATOR) || [];

  const builedEntryTemplate = buildBeforeEntryTemplate(beforeEntryTemplate, {
    loadableChunks,
    styledComponentCSS,
  });
  const buildedAfterEntryTemplate = buildAfterEntryTemplate(
    afterEntryHtmlTemplate,
    {
      loadableChunks,
    },
  );
  const builedAfterLeaveTemplate = await buildAfterLeaveTemplate({
    App,
    context,
  });

  return {
    beforeEntry: builedEntryTemplate,
    afterEntry: buildedAfterEntryTemplate,
    afterLeave: builedAfterLeaveTemplate,
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
