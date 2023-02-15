import path, { join } from 'path';
import {
  UserConfig,
  DefaultThemeConfig,
  NormalizedDefaultThemeConfig,
  SidebarItem,
  SidebarGroup,
  NormalizedSidebarGroup,
  PageIndexInfo,
} from 'shared/types';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { remark } from 'remark';
import yamlFront from 'yaml-front-matter';
import type { Root } from 'hast';
import { unified } from 'unified';
import { htmlToText } from 'html-to-text';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import { remarkPluginContainer } from '@modern-js/remark-container';
import { ReplaceRule } from 'shared/types/index';
import fs from '@modern-js/utils/fs-extra';
import { logger } from '@modern-js/utils/logger';
import { parseToc } from '../mdx/remarkPlugins/toc';
import { importStatementRegex, PACKAGE_ROOT, PUBLIC_DIR } from '../constants';
import { applyReplaceRules } from '../utils/applyReplaceRules';
import { flattenMdxContent } from '../utils/flattenMdxContent';
import { createHash } from '../utils';
import { routeService } from './routeData';
import { MDX_REGEXP, SEARCH_INDEX_NAME, withBase } from '@/shared/utils';

let pages: PageIndexInfo[] | undefined;

// The concern about future architecture:
// The `indexHash` will be generated before webpack build so we can wrap it with virtual module in webpack to ensure that client runtime can access it.The process will be like this:
// | ........................ process ........................... |
//
// Input -> | Compute index | -> Webpack build ->- Output -> | Append index file to output dir |

// However, if we generate the search index at internal webpack build process in the future, like this:
// | ........................ process ........................... |
//
// Input ->- Webpack build ->- Output ->- | Write Index file to output dir |
//                 |
//          +---------------+
//          | Compute index |
//          +---------------+
// In this way, we can compute index in a custom mdx loader instead of `@mdx-js/loader` and reuse the ast info of mdx files and cache all the compile result of unified processor.In other words, we won't need to compile mdx files twice for search index generation.

// Then there will be a problem: how can we let the client runtime access the `indexHash`?
// As far as I know, we can only do something after the webpack build process becuase the index hash is generated within webpack build process.There are two ways to do this:
// 1. insert window.__INDEX_HASH__ = 'xxx' into the html template manually
// 2. replace the `__INDEX_HASH__` placeholder in the html template with the real index hash after webpack build
// eslint-disable-next-line import/no-mutable-exports
export let indexHash = '';

export function normalizeThemeConfig(
  themeConfig: DefaultThemeConfig,
  pages: PageIndexInfo[] = [],
  base = '',
  replaceRules: ReplaceRule[],
): NormalizedDefaultThemeConfig {
  // Normalize sidebar
  const normalizeSidebar = (
    sidebar: DefaultThemeConfig['sidebar'],
  ): NormalizedDefaultThemeConfig['sidebar'] => {
    const normalizedSidebar: NormalizedDefaultThemeConfig['sidebar'] = {};
    if (!sidebar) {
      return {};
    }
    const normalizeSidebarItem = (
      item: SidebarGroup | SidebarItem | string,
    ): NormalizedSidebarGroup | SidebarItem => {
      if (typeof item === 'object' && 'items' in item) {
        return {
          text: applyReplaceRules(item.text, replaceRules),
          link: item.link,
          collapsed: item.collapsed ?? false,
          collapsible: item.collapsible ?? true,
          items: item.items.map(subItem => {
            return normalizeSidebarItem(subItem);
          }),
        };
      }

      if (typeof item === 'string') {
        const page = pages.find(
          page => page.routePath === withBase(item, base),
        );
        return {
          text: applyReplaceRules(page?.title || '', replaceRules),
          link: item,
        };
      }

      return {
        ...item,
        text: applyReplaceRules(item.text, replaceRules),
      };
    };
    Object.keys(sidebar).forEach(key => {
      const value = sidebar[key];
      normalizedSidebar[key] = value.map(normalizeSidebarItem);
    });
    return normalizedSidebar;
  };

  const normalizeNav = (nav: DefaultThemeConfig['nav']) => {
    return nav?.map(navItem => {
      return {
        ...navItem,
        text: applyReplaceRules(navItem.text, replaceRules),
      };
    });
  };

  const locales = themeConfig?.locales || [];
  if (locales.length) {
    locales.forEach(locale => {
      locale.sidebar = normalizeSidebar(locale.sidebar);
      locale.nav = normalizeNav(locale.nav);
    });
  } else {
    themeConfig.sidebar = normalizeSidebar(themeConfig.sidebar);
    themeConfig.nav = normalizeNav(themeConfig.nav);
  }

  return themeConfig as NormalizedDefaultThemeConfig;
}

async function extractPageData(
  replaceRules: ReplaceRule[],
  alias: Record<string, string | string[]>,
  domain: string,
): Promise<(PageIndexInfo | null)[]> {
  return Promise.all(
    routeService
      .getRoutes()
      .filter(route => MDX_REGEXP.test(route.absolutePath))
      .map(async (route, index) => {
        let content: string = await fs.readFile(route.absolutePath, 'utf8');
        const frontmatter = {
          // eslint-disable-next-line import/no-named-as-default-member
          ...yamlFront.loadFront(content),
        };
        if (frontmatter.pageType === 'home') {
          return null;
        }
        // 1. Replace rules for frontmatter & content
        Object.keys(frontmatter).forEach(key => {
          if (typeof frontmatter[key] === 'string') {
            frontmatter[key] = applyReplaceRules(
              frontmatter[key],
              replaceRules,
            );
          }
        });
        const flattenContent = await flattenMdxContent(
          frontmatter.__content,
          route.absolutePath,
          alias,
        );

        content = applyReplaceRules(flattenContent, replaceRules).replace(
          importStatementRegex,
          '',
        );
        // 2. Optimize content index
        const ast = remark.parse({ value: content });
        const { title, toc } = parseToc(ast as Root);
        if (!title?.length && !frontmatter.title?.length) {
          return null;
        }
        const precessor = unified()
          .use(remarkParse)
          .use(remarkPluginContainer)
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
            ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(tag => ({
              selector: tag,
              options: {
                uppercase: false,
              },
            })),
          ],
          tables: true,
          longWordSplit: {
            forceWrapOnLimit: true,
          },
        });
        if (content.startsWith(title)) {
          // Remove the title from the content
          content = content.slice(title.length);
        }
        return {
          id: index,
          title: frontmatter.title || title,
          routePath: route.routePath,
          lang: route.lang,
          toc,
          domain,
          // Stripped frontmatter content
          content,
          frontmatter: {
            ...frontmatter,
            __content: undefined,
          },
        };
      }),
  );
}

export async function siteDataVMPlugin(
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
  alias: Record<string, string | string[]>,
) {
  const entryPath = join(PACKAGE_ROOT, 'node_modules', 'virtual-site-data');
  const searchIndexHashPath = join(
    PACKAGE_ROOT,
    'node_modules',
    'virtual-search-index-hash',
  );
  const userConfig = config.doc;
  // If the dev server restart when config file, we will reuse the siteData instead of extracting the siteData from source files again.
  if (!isSSR) {
    logger.info('[doc-tools] Extracting site data...');
  }
  const replaceRules = userConfig?.replaceRules || [];
  const domain =
    userConfig?.search?.mode === 'remote'
      ? userConfig?.search.domain ?? ''
      : '';
  if (!pages) {
    pages = (await extractPageData(replaceRules, alias, domain)).filter(
      Boolean,
    ) as PageIndexInfo[];
  }
  const siteData = {
    title: userConfig?.title || '',
    description: userConfig?.description || '',
    icon: userConfig?.icon || '',
    themeConfig: normalizeThemeConfig(
      userConfig?.themeConfig || {},
      pages,
      config.doc?.base,
      config.doc?.replaceRules || [],
    ),
    base: userConfig?.base || '/',
    root: userRoot,
    lang: userConfig?.lang || 'zh',
    logo: userConfig?.logo || '',
    search: userConfig?.search || { mode: 'local' },
    pages: pages.map(({ routePath, toc }) => ({
      routePath,
      toc,
    })),
  };
  await fs.ensureDir(path.join(userRoot, PUBLIC_DIR));
  const stringfiedIndex = JSON.stringify(pages);
  indexHash = createHash(stringfiedIndex);
  await fs.writeFile(
    path.join(userRoot, PUBLIC_DIR, `${SEARCH_INDEX_NAME}.${indexHash}.json`),
    stringfiedIndex,
  );

  const plugin = new VirtualModulesPlugin({
    [entryPath]: `export default ${JSON.stringify(siteData)}`,
    [searchIndexHashPath]: `export default ${JSON.stringify(indexHash)}`,
  });
  return plugin;
}
