import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import { NavMeta, SideMeta } from './type';
import { DocPlugin, Sidebar, SidebarGroup, SidebarItem } from '@/shared/types';

// Scan all the directories and files in the work directory(such as `docs`), and then generate the nav and sidebar configuration according to the directory structure.
// We will do as follows:
// 1. scan the directory structure, and extract all the `_meta.json` files.
// The `_meta.json` files will have two types:
// - For the `_meta.json` directly in the work directory, it will be used as the nav configuration.
// - For the `_meta.json` in the subdirectory, it will be used as the sidebar configuration.
// First, for the `_meta.json` directly in the work directory, the json content will have the following structure(see `NavMeta`):
// ```ts
// export type NavMeta = NavItem[];
// export type NavItem = NavItemWithLink | NavItemWithChildren;

// export type NavItemWithLink = {
//   text: string;
//   link: string;
//   activeMatch?: string;
//   position?: 'left' | 'right';
// };

// export type NavItemChildren = {
//   text: string;
//   items: NavItemWithLink[];
// };
// ```
// The `NavItemWithLink` will be used as the nav item, and the `NavItemChildren` will be used as the nav item with children.
// Second, for the `_meta.json` in the subdirectory, the json content will have the following structure(see `SideMeta`):
// ```ts
// export type SideMetaItem =
//   | string
//   | {
//       type: 'file' | 'directory';
//       name: string;
//       // Use the h1 title as the sidebar title by default
//       label?: string;
//       collapsible?: boolean;
//       collapsed?: boolean;
//     };

// export type SideMeta = SideMetaItem[];
// ```
// The `SideMetaItem` can be the following types:
// - string: the file name, such as `home.md`, can also remove the extension name, such as `home`.
// - object: you can specify the `type` and `name` of the file or directory, and the `label` of the sidebar item, and whether the sidebar item is `collapsible` and `collapsed`.

// 2. generate the nav and sidebar configuration according to the `_meta.json` files.

// As you can see, every `_meta.json` file will have a corresponding file or directory, so we can get the link info from the file or directory(relative to the work directory).So we can generate the nav and sidebar config based on link info and _meta.json content.

// For nav config, we don't need to do anything, just use the `_meta.json` content as the nav config.
// For sidebar config, we need to transform every item of the array config:
// - string: we transform the string to a object with `text` and `link` property.Such as:
// ```ts
// {
//   text: 'home',
//   link: '/home'
// }
// ```
// - object: in this case, we will take account of the `type` property:
//   - file: we will transform the object to a object with `text` and `link` property.Such as:
//   ```ts
//   {
//     text: 'home',
//     link: '/home'
//   }
//   ```
//   - directory: we will transform the object to a object with `text` and `items` property.

// There is the following file structure:
// ```
// docs
// ├── guide
// │   ├── home.md
// │   ├── advanced
// │   │    └── plugin.md
// │   └── _meta.json
// └── _meta.json
// ```
// The `_meta.json` in the work directory has the following content:
// ```json
// [
//   {
//     "text": "guide",
//     "link": "/guide"
//   }
// ]
// ```
// The `_meta.json` in the `guide` directory has the following content:
// ```json
// [
//   'home',
//   {
//     "type": "directory",
//     "name": "advanced",
//     "label": "advanced",
//     "collapsible": true,
//     "collapsed": false
//   }
// ]
// ```
// The `home.md` has the following content:
// ```md
// # home
// ```
// The `_meta.json` in the `advanced` directory has the following content:
// ```json
// [
//   {
//     "type": "file",
//     "name": "plugin",
//     "label": "plugin",
//     "collapsible": true,
//     "collapsed": false
//   }
// ]
// ```
// The `plugin.md` has the following content:
// ```md
// # plugin
// ```

// The generated nav config will be:
// ```json
// [
//   {
//     "text": "guide",
//     "link": "/guide"
//   }
// ]
// ```
// The generated sidebar config will be:
// ```json
// [
//   {
//     "text": "home",
//     "link": "/guide/home"
//   },
//   {
//     "text": "advanced",
//     "items": [
//       {
//         "text": "plugin",
//         "link": "/guide/advanced/plugin"
//       }
//     ]
//   }
// ]
// ```
export async function detectFilePath(rawPath: string) {
  const extensions = ['.mdx', '.md', '.tsx', '.jsx', '.ts', '.js'];
  // The params doesn't have extension name, so we need to try to find the file with the extension name.
  let realPath = rawPath;
  const filename = path.basename(rawPath);
  if (filename.indexOf('.') === -1) {
    const pathWithExtension = extensions.map(ext => `${rawPath}${ext}`);
    const pathExistInfo = await Promise.all(
      pathWithExtension.map(p => fs.pathExists(p)),
    );
    realPath = pathWithExtension.find((_, i) => pathExistInfo[i]);
  }

  return realPath;
}

export async function extractH1Title(filePath: string): Promise<string> {
  const realPath = await detectFilePath(filePath);
  try {
    const content = await fs.readFile(realPath, 'utf-8');
    const h1RegExp = /^#\s+(.*)$/m;
    const match = content.match(h1RegExp);
    return match ? match[1] : '';
  } catch (e) {
    throw new Error(
      `Can't find the file: ${filePath}, please check it in "${path.join(
        path.dirname(filePath),
        '_meta.json',
      )}".`,
    );
  }
}

export async function scanSideMeta(workDir: string, rootDir: string) {
  // find the `_meta.json` file
  const metaFile = path.resolve(workDir, '_meta.json');
  const relativePath = path.relative(rootDir, workDir);
  let sideMeta: SideMeta | undefined;
  // Get the sidebar config from the `_meta.json` file
  try {
    // Don't use require to avoid require cache, which make hmr not work.
    sideMeta = (await fs.readJSON(metaFile, 'utf8')) as SideMeta;
  } catch (e) {
    sideMeta = await fs.readdir(workDir);
  }

  const sidebarFromMeta: (SidebarGroup | SidebarItem)[] = await Promise.all(
    sideMeta.map(async metaItem => {
      if (typeof metaItem === 'string') {
        const title = await extractH1Title(path.resolve(workDir, metaItem));
        return {
          text: title,
          link: `/${relativePath}/${metaItem.replace(/\.mdx?$/, '')}`,
        };
      }

      const {
        type = 'file',
        name,
        label,
        collapsible,
        collapsed,
        link,
      } = metaItem;
      if (type === 'file') {
        const title =
          label ?? (await extractH1Title(path.resolve(workDir, name)));
        return {
          text: title,
          link: `/${relativePath}/${name.replace(/\.mdx?$/, '')}`,
        };
      } else if (type === 'dir') {
        const subDir = path.resolve(workDir, name);
        const subSidebar = await scanSideMeta(subDir, rootDir);
        const realpath = await detectFilePath(subDir);
        const isExsit = await fs.pathExists(realpath);
        return {
          text: label,
          collapsible,
          collapsed,
          items: subSidebar,
          link: isExsit ? `/${relativePath}/${name}` : undefined,
        };
      } else {
        return {
          text: label,
          link,
        };
      }
    }),
  );

  return sidebarFromMeta;
}

export async function walk(workDir: string) {
  // find the `_meta.json` file
  const rootMetaFile = path.resolve(workDir, '_meta.json');
  let navConfig: NavMeta | undefined;
  // Get the nav config from the `_meta.json` file
  try {
    navConfig = (await fs.readJSON(rootMetaFile, 'utf8')) as NavMeta;
  } catch (e) {
    navConfig = [];
  }

  // find the `_meta.json` file in the subdirectory
  const subDirs = (await fs.readdir(workDir)).filter(v =>
    fs.statSync(path.join(workDir, v)).isDirectory(),
  );
  // Every sub dir will represent a group of sidebar
  const sidebarConfig: Sidebar = {};
  for (const subDir of subDirs) {
    sidebarConfig[`/${subDir}/`] = await scanSideMeta(
      path.join(workDir, subDir),
      workDir,
    );
  }
  return {
    nav: navConfig,
    sidebar: sidebarConfig,
  };
}

export function pluginAutoNavSidebar(): DocPlugin {
  return {
    name: 'auto-nav-sidebar',
    async config(config) {
      config.themeConfig = config.themeConfig || {};
      const langs =
        config.locales?.map(locale => locale.lang) ||
        config.themeConfig?.locales?.map(locale => locale.lang) ||
        [];

      const hasLocales = langs.length > 0;
      if (hasLocales) {
        config.themeConfig.locales = await Promise.all(
          config.themeConfig.locales.map(async locale => {
            return {
              ...locale,
              ...(await walk(path.join(config.root, locale.lang))),
            };
          }),
        );
      } else {
        config.themeConfig = {
          ...config.themeConfig,
          ...(await walk(config.root)),
        };
      }
      return config;
    },
  };
}
