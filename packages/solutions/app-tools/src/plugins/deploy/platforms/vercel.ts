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

export const createVercelPreset: CreatePreset = (
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

  const vercelOutput = path.join(appDirectory, '.vercel');
  const outputDirectory = path.join(vercelOutput, 'output');
  const funcsDirectory = path.join(outputDirectory, 'functions', 'index.func');
  const entryFilePath = path.join(funcsDirectory, 'index.js');
  const handlerFilePath = path.join(funcsDirectory, 'vercel-handler.cjs');
  return {
    async prepare() {
      await fse.remove(vercelOutput);
    },
    async writeOutput() {
      const config: Record<string, any> = {
        version: 3,
        routes: [
          {
            src: '/static/(.*)',
            headers: {
              'cache-control': 's-maxage=31536000, immutable',
            },
            continue: true,
          },
          {
            handle: 'filesystem',
          },
        ],
      };

      if (!needModernServer) {
        const {
          source: { mainEntryName },
        } = modernConfig;
        entrypoints.forEach(entry => {
          const isMain = isMainEntry(entry.entryName, mainEntryName);
          config.routes.push({
            src: `/${isMain ? '' : entry.entryName}(?:/.*)?`,
            headers: { 'cache-control': 's-maxage=0' },
            dest: `/html/${entry.entryName}/index.html`,
          });
        });
      } else {
        config.routes.push({
          src: '/(.*)',
          dest: `/index`,
        });
      }

      await fse.ensureDir(outputDirectory);
      await fse.writeJSON(path.join(outputDirectory, 'config.json'), config, {
        spaces: 2,
      });

      const staticDirectory = path.join(outputDirectory, 'static/static');
      await fse.copy(path.join(distDirectory, 'static'), staticDirectory);
      if (!needModernServer) {
        const destHtmlDirectory = path.join(distDirectory, 'html');
        const outputHtmlDirectory = path.join(
          path.join(outputDirectory, 'static'),
          'html',
        );
        await fse.copy(destHtmlDirectory, outputHtmlDirectory);
      } else {
        await fse.ensureDir(funcsDirectory);
        await fse.copy(distDirectory, funcsDirectory, {
          filter: (src: string) => {
            const distStaticDirectory = path.join(distDirectory, 'static');
            return !src.includes(distStaticDirectory);
          },
        });

        await fse.writeJSON(path.join(funcsDirectory, '.vc-config.json'), {
          runtime: 'nodejs16.x',
          handler: 'index.js',
          launcherType: 'Nodejs',
          shouldAddHelpers: false,
          supportsResponseStreaming: true,
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

      const pluginImportCode = genPluginImportsCode(plugins || []);
      const dynamicProdOptions = {
        config: serverConfig,
        serverConfigFile: DEFAULT_SERVER_CONFIG,
      };

      const pluginsCode = getPluginsCode(plugins || []);

      const serverAppContext = serverAppContenxtTemplate(appContext);

      let handlerCode = (
        await fse.readFile(path.join(__dirname, './vercel-handler.js'))
      ).toString();

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
          path.join(__dirname, './vercel-entry.mjs'),
          entryFilePath,
        );
      } else {
        await fse.copy(
          path.join(__dirname, './vercel-entry.js'),
          entryFilePath,
        );
      }
    },
    async end() {
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
