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

export const createNetlifyPreset: CreatePreset = (
  appContext,
  modernConfig,
  needModernServer,
) => {
  const { appDirectory, distDirectory, serverInternalPlugins, entrypoints } =
    appContext;
  const plugins = getInternalPlugins(appDirectory, serverInternalPlugins);

  const netlifyOutput = path.join(appDirectory, '.netlify');
  const funcsDirectory = path.join(netlifyOutput, 'functions');
  const entryFilePath = path.join(funcsDirectory, 'index.js');
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
        await fse.copy(distDirectory, funcsDirectory);
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
          path: '.',
        },
      };

      const pluginImportCode = genPluginImportsCode(plugins || []);
      const dynamicProdOptions = {
        config: serverConfig,
        serverConfigFile: DEFAULT_SERVER_CONFIG,
        plugins,
      };

      let entryCode = (
        await fse.readFile(path.join(__dirname, './netlifyEntry.js'))
      ).toString();

      const serverAppContext = serverAppContenxtTemplate(appContext);

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
