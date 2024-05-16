import path from 'node:path';
import {
  ROUTE_SPEC_FILE,
  DEFAULT_SERVER_CONFIG,
  fs as fse,
  getInternalPlugins,
} from '@modern-js/utils';
import { isMainEntry } from '../../../utils/routes';
import { genPluginImportsCode, serverAppContenxtTemplate } from '../utils';
import { handleDependencies } from '../dependencies';
import { CreatePreset } from './platform';

export const createVercelPreset: CreatePreset = (
  appContext,
  modernConfig,
  needModernServer,
) => {
  const { appDirectory, distDirectory, serverInternalPlugins, entrypoints } =
    appContext;
  const plugins = getInternalPlugins(appDirectory, serverInternalPlugins);
  // const entryFilePath = path.join(outputDirectory, 'index.js');

  const vercelOutput = path.join(appDirectory, '.vercel');
  const outputDirectory = path.join(vercelOutput, 'output');
  const funcsDirectory = path.join(outputDirectory, 'functions', 'index.func');
  const entryFilePath = path.join(funcsDirectory, 'index.js');
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
          path: '.',
        },
      };

      const pluginImportCode = genPluginImportsCode(plugins || []);
      const dynamicProdOptions = {
        config: serverConfig,
        serverConfigFile: DEFAULT_SERVER_CONFIG,
        plugins,
      };

      const serverAppContext = serverAppContenxtTemplate(appContext);

      let entryCode = (
        await fse.readFile(path.join(__dirname, './vercelEntry.js'))
      ).toString();

      entryCode = entryCode
        .replace('p_genPluginImportsCode', pluginImportCode)
        .replace('p_ROUTE_SPEC_FILE', `"${ROUTE_SPEC_FILE}"`)
        .replace('p_dynamicProdOptions', JSON.stringify(dynamicProdOptions))
        .replace('p_sharedDirectory', serverAppContext.sharedDirectory)
        .replace('p_apiDirectory', serverAppContext.apiDirectory)
        .replace('p_lambdaDirectory', serverAppContext.lambdaDirectory);

      await fse.writeFile(entryFilePath, entryCode);
    },
    async end() {
      if (!needModernServer) {
        return;
      }
      await handleDependencies(appDirectory, funcsDirectory, [
        '@modern-js/prod-server',
      ]);
    },
  };
};
