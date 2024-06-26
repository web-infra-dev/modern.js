import path from 'node:path';
import {
  ROUTE_SPEC_FILE,
  DEFAULT_SERVER_CONFIG,
  fs as fse,
  chalk,
} from '@modern-js/utils';
import { genPluginImportsCode, serverAppContenxtTemplate } from '../utils';
import { handleDependencies } from '../dependencies';
import { CreatePreset } from './platform';

export const createNodePreset: CreatePreset = (appContext, config) => {
  const { appDirectory, distDirectory, serverPlugins } = appContext;

  // TODO: support serverPlugin apply options.
  const plugins = serverPlugins.map(plugin => plugin.name);

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
          path: '.',
        },
      };

      const pluginImportCode = genPluginImportsCode(plugins || []);
      const dynamicProdOptions = {
        config: serverConfig,
        serverConfigFile: DEFAULT_SERVER_CONFIG,
      };

      const pluginsCode = `[${plugins
        .map((plugin, index) => {
          return `plugin_${index}()`;
        })
        .join(',')}]`;

      let entryCode = (
        await fse.readFile(path.join(__dirname, './nodeEntry.js'))
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

      await fse.writeFile(entryFilePath, entryCode);
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
