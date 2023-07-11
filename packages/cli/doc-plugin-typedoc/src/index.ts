import path from 'path';
import { Application, TSConfigReader } from 'typedoc';
import { API_DIR } from './constants';
import { resolveSidebar } from './sidebar';

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

export function pluginTypeDoc(options: PluginTypeDocOptions) {
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
    // The module tools will build error when use the types of doc-core
    // So we use any type here
    async config(config: any) {
      const app = new Application();
      docRoot = config.root;

      app.options.addReader(new TSConfigReader());

      app.bootstrap({
        name: config.title,
        entryPoints,
        plugin: ['typedoc-plugin-markdown'],
        theme: 'markdown',
        disableSources: true,
        readme: 'none',
        githubPages: false,
        // @ts-expect-error hide bread crumbs and members symbol
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
        config.themeConfig.sidebar[apiIndexLink] = await resolveSidebar(
          jsonDir,
        );
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
