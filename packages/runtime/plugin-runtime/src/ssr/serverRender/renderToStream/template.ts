import fs from 'fs';
import { RuntimeContext, ModernSSRReactComponent } from '../types';
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
): InjectTemplate {
  const filepath = context.ssrContext!.template;
  const fileContent = getFileContent(filepath);
  const loadableChunks = getLoadableChunks(context, rootElement);
  const styledComponentCSS = getStyledComponentCss(context, rootElement);
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
      App,
      context,
      prefetchData,
    },
  );

  return {
    beforeEntry: builedEntryTemplate,
    afterEntry: buildedAfterEntryTemplate,
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
