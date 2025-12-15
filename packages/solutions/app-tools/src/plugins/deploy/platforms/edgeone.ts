import path from 'node:path';
import {
  ROUTE_SPEC_FILE,
  SERVER_DIR,
  fs as fse,
  getMeta,
  removeModuleSyncFromExports,
} from '@modern-js/utils';
import { set } from '@modern-js/utils/lodash';
import { nodeDepEmit as handleDependencies } from 'ndepe';
import { isMainEntry } from '../../../utils/routes';
import { copyFileForEdgeEnv, walkDirectory } from '../edge-utils';
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

export const createEdgeOnePreset: CreatePreset = (
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

  const isEsmProject = moduleType === 'module';

  const plugins: PluginItem[] = serverPlugins.map(plugin => [
    plugin.name,
    plugin.options,
  ]);

  const eoOutput = path.join(appDirectory, '.edgeone');
  const funcsDirectory = path.join(eoOutput, 'functions');
  const funcContentDirectory = path.join(funcsDirectory, '__content__');
  const entryFilePath = path.join(funcsDirectory, '[[default]].js');
  const staticDirectory = path.join(eoOutput, 'static');
  return {
    async prepare() {
      await fse.remove(eoOutput);
    },
    async writeOutput() {
      await fse.ensureDir(eoOutput);
      const distStaticDirectory = path.join(distDirectory, `static`);
      await fse.copy(distStaticDirectory, staticDirectory);

      if (needModernServer) {
        const files: any = {};
        await fse.ensureDir(funcContentDirectory);
        await walkDirectory(distDirectory, async filePath => {
          if (filePath.startsWith(distStaticDirectory)) {
            return;
          }
          const relative = path.relative(distDirectory, filePath);
          set(
            files,
            relative.replace(/^\//, '').split('/'),
            `_DO_REQUIRE_(${relative})`,
          );
          const targetPath = path.join(funcContentDirectory, relative);
          await copyFileForEdgeEnv(filePath, targetPath);
        });
        // write all deps files
        await fse.writeFile(
          path.join(funcsDirectory, 'deps.js'),
          `export const deps = ${JSON.stringify(files).replace(/"_DO_REQUIRE_(.*?)"/g, "require('$1')")}`,
        );
        // write static file list
        const staticFilesList: string[] = [];
        await walkDirectory(staticDirectory, filePath => {
          staticFilesList.push(path.relative(staticDirectory, filePath));
        });
        await fse.writeFile(
          path.join(funcsDirectory, 'static-files-list.json'),
          JSON.stringify(staticFilesList),
        );
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

      const serverConfigPath = `path.join(__dirname, "${SERVER_DIR}", "${meta}.server")`;

      const pluginsCode = getPluginsCode(plugins);

      let entryCode = (
        await fse.readFile(path.join(__dirname, './edgeone-entry.js'))
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
          require.resolve('@modern-js/prod-server/netlify'),
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
    },
  };
};
