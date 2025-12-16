import path from 'node:path';
import {
  ROUTE_SPEC_FILE,
  fs as fse,
  getMeta,
  removeModuleSyncFromExports,
} from '@modern-js/utils';
import { nodeDepEmit as handleDependencies } from 'ndepe';
import { getServerConfigPath, serverAppContenxtTemplate } from '../edge-utils';
import {
  type PluginItem,
  genPluginImportsCode,
  getPluginsCode,
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

export const createCloudflareWorkersPreset: CreatePreset = (
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
    metaName,
  } = appContext;

  const routeJSON = path.join(distDirectory, ROUTE_SPEC_FILE);
  const { routes } = fse.readJSONSync(routeJSON);

  const plugins: PluginItem[] = serverPlugins.map(plugin => [
    plugin.name,
    plugin.options,
  ]);

  const esaOutput = path.join(appDirectory, '.cloudflare-workers');
  const funcsDirectory = path.join(esaOutput, 'functions');
  const entryFilePath = path.join(funcsDirectory, 'index.js');
  const esaDistOutput = path.join(esaOutput, 'dist');
  return {
    async prepare() {
      await fse.remove(esaOutput);
    },
    async writeOutput() {
      const distStaticDirectory = path.join(distDirectory, `static`);
      await fse.ensureDir(esaDistOutput);
      await fse.copy(distStaticDirectory, esaDistOutput);

      if (needModernServer) {
        await fse.ensureDir(funcsDirectory);
        await fse.copy(distDirectory, funcsDirectory, {
          filter: (src: string) => {
            return !src.includes(distStaticDirectory);
          },
        });
      }
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

      const meta = getMeta(metaName);

      const pluginImportCode = genPluginImportsCode(plugins || []);
      const dynamicProdOptions = {
        config: serverConfig,
      };

      const serverConfigPath = getServerConfigPath(meta);

      const pluginsCode = getPluginsCode(plugins);

      let entryCode = (
        await fse.readFile(
          path.join(__dirname, './cloudflare-workers-edge-entry.js'),
        )
      ).toString();

      const serverAppContext = serverAppContenxtTemplate(appContext);

      entryCode = entryCode
        .replace('p_genPluginImportsCode', pluginImportCode)
        .replace('p_ROUTES', JSON.stringify(routes))
        .replace('p_dynamicProdOptions', JSON.stringify(dynamicProdOptions))
        .replace('p_plugins', pluginsCode)
        .replace(
          'p_bffRuntimeFramework',
          `"${serverAppContext.bffRuntimeFramework}"`,
        )
        .replace('p_serverDirectory', serverConfigPath)
        .replace('p_sharedDirectory', serverAppContext.sharedDirectory)
        .replace('p_apiDirectory', serverAppContext.apiDirectory)
        .replace('p_lambdaDirectory', serverAppContext.lambdaDirectory);

      await fse.writeFile(entryFilePath, entryCode);
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
        sourceDir: funcsDirectory,
        includeEntries: [
          require.resolve('@modern-js/prod-server'),
          require.resolve('@modern-js/prod-server/cloudflare-workers'),
        ],
        copyWholePackage(pkgName) {
          return pkgName === '@modern-js/utils';
        },
        transformPackageJson: ({ pkgJSON }) => {
          if (!pkgJSON.exports || typeof pkgJSON.exports !== 'object') {
            return pkgJSON;
          }

          return {
            ...pkgJSON,
            exports: removeModuleSyncFromExports(
              pkgJSON.exports as Record<string, any>,
            ),
          };
        },
      });
      // TODO: generate wrangler.jsonc
    },
  };
};
