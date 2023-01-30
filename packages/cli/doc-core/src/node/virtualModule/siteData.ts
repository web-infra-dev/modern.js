import path, { join } from 'path';
import {
  PageBasicInfo,
  SiteData,
  UserConfig,
  DefaultThemeConfig,
  NormalizedDefaultThemeConfig,
  SidebarItem,
  SidebarGroup,
  NormalizedSidebarGroup,
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
import { parseToc } from '../mdx/remarkPlugins/toc';
import { importStatementRegex, PACKAGE_ROOT, PUBLIC_DIR } from '../constants';
import { applyReplaceRules } from '../utils/applyReplaceRules';
import { routeService } from './routeData';
import { withBase } from '@/shared/utils';

export function normalizeThemeConfig(
  themeConfig: DefaultThemeConfig,
  pages: PageBasicInfo[] = [],
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
    routeService.getRoutes().map(async (route, index) => {
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
        ],
        uppercaseHeadings: false,
        tables: true,
        longWordSplit: {
          forceWrapOnLimit: true,
        },
      });
      return {
        id: index,
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
    pages: pages.map(({ routePath, toc }) => ({
      routePath,
      toc,
    })),
  };
  await fs.ensureDir(path.join(userRoot, PUBLIC_DIR));
  await fs.writeFile(
    path.join(userRoot, PUBLIC_DIR, 'search_index.json'),
    JSON.stringify(pages),
  );
  const plugin = new VirtualModulesPlugin({
    [entryPath]: `export default ${JSON.stringify(siteData)}`,
  });
  return plugin;
}
