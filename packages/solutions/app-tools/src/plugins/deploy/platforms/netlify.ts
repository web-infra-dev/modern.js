import path from 'node:path';
import {
  DEFAULT_SERVER_CONFIG,
  ROUTE_SPEC_FILE,
  fs as fse,
} from '@modern-js/utils';
import { isMainEntry } from '../../../utils/routes';
import { handleDependencies } from '../dependencies';
import {
  type PluginItem,
  genPluginImportsCode,
  getPluginsCode,
  serverAppContenxtTemplate,
} from '../utils';
import type { CreatePreset } from './platform';

async function cleanDistDirectory(dir: string) {
  try {
    const items = await fse.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (item !== 'static' && item !== '_redirects' && item !== 'html') {
        await fse.remove(fullPath);
      }
    }
  } catch (error) {
    console.error('Error cleaning directory:', error);
  }
}

export const createNetlifyPreset: CreatePreset = (
  appContext,
  modernConfig,
  needModernServer,
) => {
  const {
    appDirectory,
    distDirectory,
    entrypoints,
    serverPlugins,
    moduleType,
  } = appContext;

  const isEsmProject = moduleType === 'module';

  const plugins: PluginItem[] = serverPlugins.map(plugin => [
    plugin.name,
    plugin.options,
  ]);

  const netlifyOutput = path.join(appDirectory, '.netlify');
  const funcsDirectory = path.join(netlifyOutput, 'functions');
  const entryFilePath = path.join(funcsDirectory, 'index.js');
  const handlerFilePath = path.join(funcsDirectory, 'netlify-handler.cjs');
  return {
    async prepare() {
      await fse.remove(netlifyOutput);
    },
    async writeOutput() {
      const routes: {
        src: string;
        dest: string;
        status: number;
      }[] = [];
      const {
        source: { mainEntryName },
      } = modernConfig;

      if (!needModernServer) {
        entrypoints.forEach(entry => {
          const isMain = isMainEntry(entry.entryName, mainEntryName);
          routes.push({
            src: `/${isMain ? '' : `${entry.entryName}/`}*`,
            dest: `/html/${entry.entryName}/index.html`,
            status: 200,
          });
        });
      } else {
        routes.push({
          src: '/*',
          dest: `/.netlify/functions/index`,
          status: 200,
        });
      }

      const redirectContent = routes
        .map(route => {
          return `${route.src} ${route.dest} ${route.status}`;
        })
        .join('\n');

      if (needModernServer) {
        await fse.ensureDir(funcsDirectory);
        await fse.copy(distDirectory, funcsDirectory, {
          filter: (src: string) => {
            const distStaticDirectory = path.join(distDirectory, `static`);
            return !src.includes(distStaticDirectory);
          },
        });
      }

      // redirect files don't need to be in the function directory
      const redirectFilePath = path.join(distDirectory, '_redirects');
      await fse.writeFile(redirectFilePath, redirectContent);
    },
    async genEntry() {
      if (!needModernServer) {
        return;
      }
      const serverConfig = {
        bff: {
          prefix: modernConfig?.bff?.prefix,
        },
        output: {
          distPath: {
            root: '.',
          },
        },
      };

      const pluginImportCode = genPluginImportsCode(plugins || []);
      const dynamicProdOptions = {
        config: serverConfig,
        serverConfigFile: DEFAULT_SERVER_CONFIG,
      };

      const pluginsCode = getPluginsCode(plugins);

      let handlerCode = (
        await fse.readFile(path.join(__dirname, './netlify-handler.js'))
      ).toString();

      const serverAppContext = serverAppContenxtTemplate(appContext);

      handlerCode = handlerCode
        .replace('p_genPluginImportsCode', pluginImportCode)
        .replace('p_ROUTE_SPEC_FILE', `"${ROUTE_SPEC_FILE}"`)
        .replace('p_dynamicProdOptions', JSON.stringify(dynamicProdOptions))
        .replace('p_plugins', pluginsCode)
        .replace('p_sharedDirectory', serverAppContext.sharedDirectory)
        .replace('p_apiDirectory', serverAppContext.apiDirectory)
        .replace('p_lambdaDirectory', serverAppContext.lambdaDirectory);

      await fse.writeFile(handlerFilePath, handlerCode);
      if (isEsmProject) {
        // We will not modify the entry file for the time, because we have not yet converted all the packages available for esm.
        await fse.copy(
          path.join(__dirname, './netlify-entry.mjs'),
          entryFilePath,
        );
      } else {
        await fse.copy(
          path.join(__dirname, './netlify-entry.js'),
          entryFilePath,
        );
      }
    },
    async end() {
      if (process.env.NODE_ENV !== 'development') {
        await cleanDistDirectory(distDirectory);
      }
      if (!needModernServer) {
        return;
      }
      await handleDependencies({
        appDir: appDirectory,
        serverRootDir: funcsDirectory,
        includeEntries: [require.resolve('@modern-js/prod-server')],
      });
    },
  };
};
