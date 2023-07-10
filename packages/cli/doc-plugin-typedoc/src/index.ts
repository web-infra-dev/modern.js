import path from 'path';
import { Application, TSConfigReader } from 'typedoc';
import fs from '@modern-js/utils/fs-extra';

function transformModuleName(name: string) {
  return name.replace(/\//g, '_').replace(/-/g, '_');
}

const API_DIR = 'api';
const ROUTE_PREFIX = `/${API_DIR}`;

function getModulePath(name: string) {
  return path
    .join(`${ROUTE_PREFIX}/modules`, `${transformModuleName(name)}`)
    .replace(/\\/g, '/');
}

function getClassPath(moduleName: string, className: string) {
  return path
    .join(
      `${ROUTE_PREFIX}/classes`,
      `${transformModuleName(moduleName)}.${className}`,
    )
    .replace(/\\/g, '/');
}

function getInterfacePath(moduleName: string, interfaceName: string) {
  return path
    .join(
      `${ROUTE_PREFIX}/interfaces`,
      `${transformModuleName(moduleName)}.${interfaceName}`,
    )
    .replace(/\\/g, '/');
}

function getFunctionPath(moduleName: string, functionName: string) {
  return path
    .join(
      `${ROUTE_PREFIX}/functions`,
      `${transformModuleName(moduleName)}.${functionName}`,
    )
    .replace(/\\/g, '/');
}

async function resolveSidebar(jsonDir: string): Promise<any[]> {
  const result: any[] = [];
  const data = JSON.parse(await fs.readFile(jsonDir, 'utf-8'));
  if (!data.children || data.children.length <= 0) {
    return result;
  }
  data.children.forEach(
    (module: {
      name: string;
      children: {
        name: string;
        kindString: 'Class' | 'Interface' | 'Function';
      }[];
    }) => {
      let moduleNames = module.name.split('/');
      let name = moduleNames[moduleNames.length - 1];
      const moduleConfig = {
        text: `Module:${name}`,
        items: [{ text: 'Overview', link: getModulePath(module.name) }],
      };
      if (!module.children || module.children.length <= 0) {
        return;
      }
      module.children.forEach(sub => {
        switch (sub.kindString) {
          case 'Class':
            moduleConfig.items.push({
              text: `Class:${sub.name}`,
              link: getClassPath(module.name, sub.name),
            });
            break;
          case 'Interface':
            moduleConfig.items.push({
              text: `Interface:${sub.name}`,
              link: getInterfacePath(module.name, sub.name),
            });
            break;
          case 'Function':
            moduleConfig.items.push({
              text: `Function:${sub.name}`,
              link: getFunctionPath(module.name, sub.name),
            });
            break;
          default:
            break;
        }
      });
      result.push(moduleConfig as any);
    },
  );
  // Patch /api/README.md
  const readmeFile = path.join(path.dirname(jsonDir), 'README.md');
  const readme = await fs.readFile(readmeFile, 'utf-8');
  // replace: [xxx](yyy) -> [xxx](./yyy)
  const newReadme = readme.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, p1, p2) => {
      return `[${p1}](./${p2})`;
    },
  );

  await fs.writeFile(readmeFile, newReadme);

  return result;
}

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
      console.log('entryPoints', entryPoints);
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
          link: apiIndexLink + 'README',
        });
      }
      config.route = config.route || {};
      config.route.exclude = config.route.exclude || [];
      return config;
    },
  };
}
