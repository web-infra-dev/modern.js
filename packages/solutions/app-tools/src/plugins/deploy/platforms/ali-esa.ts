import path from 'node:path';
import {
  ROUTE_SPEC_FILE,
  lodash as _,
  fs as fse,
  getMeta,
} from '@modern-js/utils';
import {
  copyDeps,
  generateHandler,
  getServerConfigPath,
  serverAppContenxtTemplate,
} from '../edge-utils';
import {
  type PluginItem,
  genPluginImportsCode,
  getPluginsCode,
} from '../utils';
import type { CreatePreset, Setup } from './platform';

export const setupAliESA: Setup = api => {
  api.modifyRsbuildConfig(config => {
    _.set(config, 'environments.node.source.entry.modern-server', [
      require.resolve('@modern-js/prod-server/ali-esa'),
    ]);
    return config;
  });
};

export const createAliESAPreset: CreatePreset = (
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

  const esaOutput = path.join(appDirectory, '.ali-esa');
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
        await copyDeps(distDirectory, funcsDirectory, distStaticDirectory);
      }
    },
    async genEntry() {
      if (!needModernServer) {
        return;
      }
      const handlerTemplate = (
        await fse.readFile(path.join(__dirname, './ali-esa-entry.mjs'))
      ).toString();
      const handlerCode = await generateHandler(
        handlerTemplate,
        appContext,
        modernConfig,
      );
      await fse.writeFile(entryFilePath, handlerCode);
    },
  };
};
