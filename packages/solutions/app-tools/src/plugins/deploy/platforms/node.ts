import path from 'node:path';
import {
  DEFAULT_SERVER_CONFIG,
  ROUTE_SPEC_FILE,
  chalk,
  fs as fse,
} from '@modern-js/utils';
import { handleDependencies } from '../dependencies';
import {
  type PluginItem,
  genPluginImportsCode,
  getPluginsCode,
  serverAppContenxtTemplate,
} from '../utils';
import type { CreatePreset } from './platform';

export const createNodePreset: CreatePreset = (appContext, config) => {
  const { appDirectory, distDirectory, serverPlugins, moduleType } = appContext;
  const isEsmProject = moduleType === 'module';

  const plugins: PluginItem[] = serverPlugins.map(plugin => [
    plugin.name,
    plugin.options,
  ]);

  const outputDirectory = path.join(appDirectory, '.output');
  const staticDirectory = path.join(outputDirectory, 'static');
  const entryFilePath = path.join(outputDirectory, 'index.js');
  return {
    async prepare() {
      await fse.remove(outputDirectory);
    },
    async writeOutput() {
      await fse.copy(distDirectory, outputDirectory);
    },
    async genEntry() {
      const serverConfig = {
        server: {
          port: 8080,
        },
        bff: {
          prefix: config?.bff?.prefix,
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

      let entryCode = (
        await fse.readFile(path.join(__dirname, './node-entry.js'))
      ).toString();

      const serverAppContext = serverAppContenxtTemplate(appContext);

      entryCode = entryCode
        .replace('p_genPluginImportsCode', pluginImportCode)
        .replace('p_ROUTE_SPEC_FILE', `"${ROUTE_SPEC_FILE}"`)
        .replace('p_dynamicProdOptions', JSON.stringify(dynamicProdOptions))
        .replace('p_plugins', pluginsCode)
        .replace('p_sharedDirectory', serverAppContext.sharedDirectory)
        .replace('p_apiDirectory', serverAppContext.apiDirectory)
        .replace('p_lambdaDirectory', serverAppContext.lambdaDirectory);

      if (isEsmProject) {
        // We will not modify the entry file for the time, because we have not yet converted all the packages available for esm.
        const cjsEntryFilePath = path.join(outputDirectory, 'index.cjs');
        await fse.writeFile(cjsEntryFilePath, entryCode);
        await fse.writeFile(entryFilePath, `import('./index.cjs');`);
      } else {
        await fse.writeFile(entryFilePath, entryCode);
      }
    },
    async end() {
      console.log(
        'Static directory:',
        chalk.blue(path.relative(appDirectory, staticDirectory)),
      );
      console.log(
        `You can preview this build by`,
        chalk.blue(`node .output/index`),
      );

      const filter = (filePath: string) => {
        return !filePath.startsWith(staticDirectory);
      };
      // Because @modern-js/prod-server is an implicit dependency of the entry, so we add it to the include here.
      await handleDependencies({
        appDir: appDirectory,
        serverRootDir: outputDirectory,
        includeEntries: [require.resolve('@modern-js/prod-server')],
        entryFilter: filter,
      });
    },
  };
};
