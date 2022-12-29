import path, { dirname } from 'path';
import { sync } from '@modern-js/utils/globby';
import { readJSON, readFile, writeFile } from '@modern-js/utils/fs-extra';
import { loadFront } from 'yaml-front-matter';

const DEFAULT_COLLAPSED = true;

export interface CategoryMeta {
  label?: string;
  position?: number;
  sidebar_position?: number;
  collapsed?: boolean;
  link?: {
    type: string;
    id: string;
  };
}

export interface FileMeta {
  title?: string;
  sidebar_label?: string;
  position?: number;
  sidebar_position?: number;
}

export interface Category {
  meta?: CategoryMeta;
  path: string;
  length: number;
  children?: (Category | File)[];
}

export interface File {
  meta: FileMeta;
  path: string;
  length: number;
  category?: Category;
  title: string;
}

interface SidebarGroup {
  text: string;
  link?: string;
  items: (SidebarGroup | SidebarItem)[];
  collapsed?: boolean;
  // For internal usage
  path?: string;
}

interface SidebarItem {
  text: string;
  link: string;
}

type Sidebar = Record<string, (SidebarGroup | SidebarItem)[]>;

interface LocaleConfig {
  sidebar?: Sidebar;
  lang: string;
}

interface DocConfig {
  lang?: string;
  base?: string;
  themeConfig?: {
    locales?: LocaleConfig[];
  };
}

const addLeadingSlash = (str: string) =>
  str.startsWith('/') ? str : `/${str}`;

const addTailingSlash = (str: string) => (str.endsWith('/') ? str : `${str}/`);

const removeLeadingSlash = (str: string) =>
  str.startsWith('/') ? str.slice(1) : str;

const removeTrailingSlash = (str: string) =>
  str.endsWith('/') ? str.slice(0, -1) : str;

export function withBase(url: string, base: string) {
  const normalizedBase = addLeadingSlash(removeTrailingSlash(base));
  const normalizedUrl = addLeadingSlash(url);
  return normalizedBase === '/'
    ? normalizedUrl
    : `${normalizedBase}${normalizedUrl}`;
}

const extractExtension = (str: string) => {
  const index = str.lastIndexOf('.');
  return index > 0 ? str.slice(0, index) : str;
};

export interface Options {
  root: string;
  categories: string[];
}

export async function initFiles(paths: string[], userRoot: string) {
  return Promise.all(
    paths
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .map(async file => {
        let content = await readFile(path.join(userRoot, file), 'utf-8');
        const meta = loadFront(content) as FileMeta;
        const h1RegExp = /^#\s+(.*)$/m;
        const title =
          meta.sidebar_label ||
          meta.title ||
          (h1RegExp.exec(content) || [])[1] ||
          extractExtension(path.basename(file));
        // Add #title to the content of the file
        if (!h1RegExp.test(content)) {
          content = content.replace(/(---(.*?)---)/ms, `$1\n# ${title}`);
          await writeFile(path.join(userRoot, file), content);
        }
        return {
          meta,
          path: file,
          title,
          length: file.split(path.delimiter).length,
        };
      }),
  );
}

export async function initAllCategories(
  paths: string[],
  userRoot: string,
  files: File[],
) {
  const categories: Category[] = await Promise.all(
    paths
      .filter(file => file.endsWith('.json'))
      .map(async file => {
        const meta = (await readJSON(
          path.join(userRoot, file),
        )) as CategoryMeta;
        return {
          meta,
          path: dirname(file),
          length: file.split(path.delimiter).length - 1,
        };
      }),
  );
  categories.sort((a, b) => a.length - b.length);
  categories.forEach((category, index) => {
    category.children = [];
    files.forEach(file => {
      if (dirname(file.path) === category.path) {
        category.children!.push(file);
      }
    });

    for (let i = index + 1; i < categories.length; i++) {
      const childCategory = categories[i];
      if (dirname(childCategory.path) === category.path) {
        category.children.push(childCategory);
      }
    }

    category.children.sort((a, b) => {
      const positionA = a.meta?.position || a.meta?.sidebar_position || 0;
      const positionB = b.meta?.position || b.meta?.sidebar_position || 0;
      return positionA - positionB;
    });
  });

  return categories;
}

export function getRootCategories(
  rootCategories: string[],
  categories: Category[],
  files: File[],
) {
  return rootCategories.sort().map(item => {
    const normalizeCategoryPath = (str: string) =>
      removeLeadingSlash(removeTrailingSlash(str));
    const category: Category = {
      path: normalizeCategoryPath(item),
      length: item.split(path.delimiter).length,
    };
    category.children = [];
    categories.forEach(childCategory => {
      if (dirname(childCategory.path) === item) {
        category.children!.push(childCategory);
      }
    });

    files.forEach(file => {
      if (dirname(file.path) === item) {
        category.children!.push(file);
      }
    });

    category.children.sort((a, b) => {
      const positionA = a.meta?.position || a.meta?.sidebar_position || 0;
      const positionB = b.meta?.position || b.meta?.sidebar_position || 0;
      return positionA - positionB;
    });

    return category;
  });
}

/**
 * The plugin is used to generate sidebar automatically.
 */
export function pluginAutoSidebar(options: Options) {
  const { root: userRoot, categories: rootCategories } = options;
  const paths = sync('**/*.{md,mdx,json}', {
    cwd: userRoot,
  });

  const createSidebarItem = (
    item: Category | File,
  ): SidebarGroup | SidebarItem => {
    if ('children' in item) {
      const { label, link, collapsed = DEFAULT_COLLAPSED } = item.meta!;
      return {
        text: label || '默认',
        link: link?.id,
        items: item.children!.map(child => createSidebarItem(child)),
        collapsed,
      };
    }
    const { title } = item as File;
    return {
      text: title,
      link: addLeadingSlash(extractExtension(item.path)),
    };
  };

  return {
    name: '@modern-js/doc-plugin-auto',
    async config(docConfig: DocConfig) {
      docConfig.themeConfig = docConfig.themeConfig || {};
      const defaultLang = docConfig.lang || 'zh';
      const base = docConfig.base || '/';
      const normalizeKey = (p: string) => addLeadingSlash(addTailingSlash(p));
      const files = await initFiles(paths, userRoot);
      const categories = await initAllCategories(paths, userRoot, files);
      const normalizedRootCategories = getRootCategories(
        rootCategories,
        categories,
        files,
      );
      docConfig.themeConfig.locales?.forEach((locale: LocaleConfig) => {
        const { lang } = locale;
        const isDefaultLang = lang === defaultLang;
        const sidebar: Sidebar = {};
        const categories = normalizedRootCategories.filter(category =>
          removeLeadingSlash(category.path).startsWith(lang),
        );
        if (isDefaultLang) {
          const extractDefaultLang = (p: string) =>
            removeLeadingSlash(p).replace(new RegExp(`^${lang}`), '');
          categories.forEach(category => {
            sidebar[normalizeKey(extractDefaultLang(category.path))] =
              category.children!.map(child => createSidebarItem(child));
          });
        } else {
          categories.forEach(category => {
            sidebar[normalizeKey(category.path)] = category.children!.map(
              child => createSidebarItem(child),
            );
          });
        }
        const extractLang = (p: string) =>
          removeLeadingSlash(p).replace(new RegExp(`^${defaultLang}`), '');
        const normalizeLink = (item: SidebarGroup | SidebarItem) => {
          if ('items' in item) {
            item.items.forEach(child => normalizeLink(child));
          }
          if (item.link) {
            item.link = withBase(extractLang(item.link), base).replace(
              /index$/,
              '',
            );
            if ('items' in item) {
              item.items = item.items.filter(
                (child: SidebarGroup | SidebarItem) =>
                  'items' in child || (child.link && child.link !== item.link),
              );
            }
          }
        };
        Object.values(sidebar)
          .flat()
          .forEach(item => normalizeLink(item));
        locale.sidebar = sidebar;
      });
      return docConfig;
    },
  };
}
