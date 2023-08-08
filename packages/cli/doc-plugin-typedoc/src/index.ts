import path from 'path';
import { Application, TSConfigReader } from 'typedoc';
import type { DocPlugin } from '@modern-js/doc-core/src/shared/types/Plugin';
import { load } from 'typedoc-plugin-markdown';
import { API_DIR } from './constants';
import {
  resolveSidebarForMultiEntry,
  resolveSidebarForSingleEntry,
} from './sidebar';

export interface PluginTypeDocOptions {
  /**
   * The entry points of modules.
   * @default []
   */
  entryPoints: string[];
  /**
   * The output directory.
   * @default 'api'
   */
  outDir?: string;
}

export function pluginTypeDoc(options: PluginTypeDocOptions): DocPlugin {
  let docRoot: string | undefined;
  const { entryPoints = [], outDir = API_DIR } = options;
  return {
    name: 'doc-plugin-typedoc',
    async addPages() {
      return [
        {
          routePath: `${outDir.replace(/\/$/, '')}/`,
          filepath: path.join(docRoot!, outDir, 'README.md'),
        },
      ];
    },
    async config(config) {
      const app = new Application();
      docRoot = config.root;
      app.options.addReader(new TSConfigReader());
      load(app);
      app.bootstrap({
        name: config.title,
        entryPoints,
        theme: 'markdown',
        disableSources: true,
        readme: 'none',
        githubPages: false,
        requiredToBeDocumented: ['Class', 'Function', 'Interface'],
        plugin: ['typedoc-plugin-markdown'],
        // @ts-expect-error MarkdownTheme has no export
        hideBreadcrumbs: true,
        hideMembersSymbol: true,
        allReflectionsHaveOwnDocument: true,
      });
      const project = app.convert();

      if (project) {
        // 1. Generate module doc by typedoc
        const absoluteOutputdir = path.join(docRoot!, outDir);
        await app.generateDocs(project, absoluteOutputdir);
        const jsonDir = path.join(absoluteOutputdir, 'documentation.json');
        await app.generateJson(project, jsonDir);
        // 2. Generate sidebar
        config.themeConfig = config.themeConfig || {};
        config.themeConfig.nav = config.themeConfig.nav || [];
        const apiIndexLink = `/${outDir.replace(/(^\/)|(\/$)/, '')}/`;
        config.themeConfig.nav.push({
          text: 'API',
          link: apiIndexLink,
        });
        config.themeConfig.sidebar = config.themeConfig.sidebar || {};
        config.themeConfig.sidebar[apiIndexLink] =
          entryPoints.length > 1
            ? await resolveSidebarForMultiEntry(jsonDir)
            : await resolveSidebarForSingleEntry(jsonDir);
        config.themeConfig.sidebar[apiIndexLink].unshift({
          text: 'Overview',
          link: `${apiIndexLink}README`,
        });
      }
      config.route = config.route || {};
      config.route.exclude = config.route.exclude || [];
      return config;
    },
  };
}
