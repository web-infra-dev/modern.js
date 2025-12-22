import path from 'node:path';
import {
  ROUTE_SPEC_FILE,
  SERVER_DIR,
  lodash as _,
  fs as fse,
  getMeta,
  removeModuleSyncFromExports,
} from '@modern-js/utils';
import { nodeDepEmit as handleDependencies } from 'ndepe';
import {
  copyFileForEdge,
  getServerConfigPath,
  normalizePath,
  serverAppContenxtTemplate,
  walkDirectory,
} from '../edge-utils';
import {
  type PluginItem,
  genPluginImportsCode,
  getPluginsCode,
} from '../utils';

import type { CreatePreset, Setup } from './platform';

export const setupEdgeOne: Setup = api => {
  api.modifyRsbuildConfig(config => {
    _.set(config, 'environments.node.source.entry.modern-server', [
      require.resolve('@modern-js/prod-server/edgeone'),
    ]);
    return config;
  });
};

export const createEdgeOnePreset: CreatePreset = (
  appContext,
  modernConfig,
  needModernServer,
) => {
  const { appDirectory, distDirectory, serverPlugins, metaName } = appContext;

  const routeJSON = path.join(distDirectory, ROUTE_SPEC_FILE);
  const { routes } = fse.readJSONSync(routeJSON);

  const plugins: PluginItem[] = serverPlugins.map(plugin => [
    plugin.name,
    plugin.options,
  ]);

  const eoOutput = path.join(appDirectory, '.eo-output');
  const funcsDirectory = path.join(eoOutput, 'node-functions');
  const funcContentDirectory = path.join(funcsDirectory, '_content');
  const handlerFilePath = path.join(funcContentDirectory, 'handler.js');
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
        const files: Record<string, string> = {};
        await fse.ensureDir(funcContentDirectory);

        // copy deps
        await walkDirectory(distDirectory, async filePath => {
          if (filePath.startsWith(distStaticDirectory)) {
            return;
          }
          const relative = normalizePath(
            path.relative(distDirectory, filePath),
          );
          const targetPath = path.join(funcContentDirectory, relative);
          if (false !== (await copyFileForEdge(filePath, targetPath))) {
            files[relative] = `_MODERNJS_EDGE_REQUIRE_(${relative})`;
          }
        });

        // generate deps file
        await fse.writeFile(
          path.join(funcContentDirectory, 'deps.js'),
          `export const deps = ${JSON.stringify(files, undefined, 2).replace(/"_MODERNJS_EDGE_REQUIRE_\((.*?)\)"/g, "require('./$1')")}`,
        );

        // generate static file list
        const staticFilesList: string[] = [];
        await walkDirectory(staticDirectory, filePath => {
          staticFilesList.push(
            normalizePath(path.relative(staticDirectory, filePath)),
          );
        });
        await fse.writeFile(
          path.join(funcContentDirectory, 'static-files-list.json'),
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

      const serverConfigPath = getServerConfigPath(meta);

      const pluginsCode = getPluginsCode(plugins);

      let handlerCode = (
        await fse.readFile(path.join(__dirname, './edgeone-handler.mjs'))
      ).toString();

      const serverAppContext = serverAppContenxtTemplate(appContext);

      handlerCode = handlerCode
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

      await fse.writeFile(handlerFilePath, handlerCode);

      const entryCode = `import { handleRequest } from './_content/handler.js'; export const onRequest = handleRequest`;
      await fse.writeFile(path.join(funcsDirectory, 'index.js'), entryCode);
      await fse.writeFile(
        path.join(funcsDirectory, '[[default]].js'),
        entryCode,
      );
    },
  };
};
