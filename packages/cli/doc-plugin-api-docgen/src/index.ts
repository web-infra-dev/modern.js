import path from 'path';
import type { DocPlugin } from '@modern-js/doc-core';
import fs from '@modern-js/utils/fs-extra';
import type {
  PluginOptions,
  SupportLanguages,
  ExtendedPageData,
} from './types';
import { docgen } from './docgen';
import { apiDocMap } from './constants';

/**
 * The plugin is used to generate api doc for files..
 */
export function pluginApiDocgen(options?: PluginOptions): DocPlugin {
  const {
    entries = {},
    apiParseTool = 'react-docgen-typescript',
    appDir = process.cwd(),
    parseToolOptions = {},
  } = options || {};
  return {
    name: '@modern-js/doc-plugin-api-docgen',
    async beforeBuild(config, isProd) {
      // only support zh and en
      const languages = (
        config.themeConfig?.locales?.map(locale => locale.lang) ||
        config.locales?.map(locale => locale.lang) || [config.lang]
      ).filter(lang => lang === 'zh' || lang === 'en') as SupportLanguages[];
      await docgen({
        entries,
        apiParseTool,
        languages,
        appDir,
        parseToolOptions,
        isProd,
      });
    },
    async modifySearchIndexData(pages) {
      // Update the search index of module doc which includes `<API moduleName="xxx" />`
      const apiCompRegExp = /<API\s+moduleName=['"](\S+)['"]\s*(.*)?\/>/g;
      await Promise.all(
        pages.map(async page => {
          const { _filepath, lang } = page;
          let content = await fs.readFile(_filepath, 'utf-8');
          let matchResult = apiCompRegExp.exec(content);
          if (!matchResult) {
            return;
          }
          while (matchResult !== null) {
            const [matchContent, moduleName] = matchResult;
            const apiDoc =
              apiDocMap[moduleName] || apiDocMap[`${moduleName}-${lang}`];
            content = content.replace(matchContent, apiDoc);
            matchResult = apiCompRegExp.exec(content);
          }
          page.content = content;
        }),
      );
    },
    extendPageData(pageData) {
      (pageData as ExtendedPageData).apiDocMap = { ...apiDocMap };
    },
    markdown: {
      globalComponents: [
        path.join(__dirname, '..', 'static', 'global-components', 'API.tsx'),
      ],
    },
  };
}

export type { PluginOptions };
