import { join } from 'path';
import { SiteData, UserConfig } from 'shared/types';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { remark } from 'remark';

import yamlFront from 'yaml-front-matter';
import type { Root } from 'hast';
import { unified } from 'unified';
import { htmlToText } from 'html-to-text';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import remarkDirective from 'remark-directive';
import { parseToc } from '../mdx/remarkPlugins/toc';
import { importStatementRegex, PACKAGE_ROOT } from '../constants';
import { applyReplaceRules } from '../utils/applyReplaceRules';
import { routeService } from './routeData';

export async function createSiteDataVirtualModulePlugin(
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
) {
  const entryPath = join(PACKAGE_ROOT, 'node_modules', 'virtual-site-data');
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const userConfig = config.doc;
  if (!isSSR) {
    // eslint-disable-next-line no-console
    console.log('⭐️ [doc-tools] Extracting site data...');
  }
  const replaceRules = userConfig?.replaceRules || [];
  const pages = await Promise.all(
    routeService.getRoutes().map(async route => {
      let content: string = await fs.readFile(route.absolutePath, 'utf8');
      const frontmatter = {
        // eslint-disable-next-line import/no-named-as-default-member
        ...yamlFront.loadFront(content),
      };
      // 1. Replace rules for frontmatter & content
      Object.keys(frontmatter).forEach(key => {
        if (typeof frontmatter[key] === 'string') {
          frontmatter[key] = applyReplaceRules(frontmatter[key], replaceRules);
        }
      });
      content = applyReplaceRules(frontmatter.__content, replaceRules).replace(
        importStatementRegex,
        '',
      );
      // 2. Optimize content index
      const ast = remark.parse({ value: content });
      const { title, toc } = parseToc(ast as Root);
      const precessor = unified()
        .use(remarkParse)
        .use(remarkDirective)
        .use(remarkHtml);
      const html = await precessor.process(content);
      content = htmlToText(String(html), {
        wordwrap: 80,
        selectors: [
          {
            selector: 'a',
            options: {
              ignoreHref: true,
            },
          },
          {
            selector: 'img',
            format: 'skip',
          },
        ],
        uppercaseHeadings: false,
        tables: true,
        longWordSplit: {
          forceWrapOnLimit: true,
        },
      });
      return {
        title: frontmatter.title || title,
        routePath: route.routePath,
        toc,
        // Stripped frontmatter content
        content,
        frontmatter: {
          ...frontmatter,
          __content: undefined,
        },
      };
    }),
  );
  const siteData: SiteData = {
    title: userConfig?.title || '',
    description: userConfig?.description || '',
    icon: userConfig?.icon || '',
    themeConfig: userConfig?.themeConfig || {},
    base: userConfig?.base || '/',
    root: userRoot,
    lang: userConfig?.lang || 'zh',
    logo: userConfig?.logo || '',
    pages,
  };
  const plugin = new VirtualModulesPlugin({
    [entryPath]: `export default ${JSON.stringify(siteData)}`,
  });
  return plugin;
}
