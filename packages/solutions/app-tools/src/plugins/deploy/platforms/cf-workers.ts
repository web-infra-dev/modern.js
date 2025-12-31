import path from 'node:path';
import { lodash as _, fs as fse } from '@modern-js/utils';
import { getServerPlugins } from '../../../utils/loadPlugins';
import {
  copyDeps,
  copyEntriesHtml,
  generateHandler,
  generateProdServerEntry,
  modifyCommonConfig,
} from '../edge-utils';
import type { CreatePreset, Setup } from './platform';

export const setupCFWorkers: Setup = async api => {
  api.generateEntryCode(async () => {
    await getServerPlugins(api);
    await generateProdServerEntry(api.getAppContext(), 'cf-workers');
  });
  modifyCommonConfig(api);
  api.modifyRsbuildConfig(config => {
    if (_.get(config, 'environments.node')) {
      // polyfill __nccwpck_require__
      _.set(config, 'environments.node.source.define.__dirname', "'/bundle'");
    }
    return config;
  });
};

export const createCFWorkersPreset: CreatePreset = (
  appContext,
  modernConfig,
  needModernServer,
) => {
  const { appDirectory, distDirectory, entrypoints } = appContext;

  const output = path.join(appDirectory, '.cf-workers');
  const funcsDirectory = path.join(output, 'functions');
  const assetsDirectory = path.join(output, 'assets');
  return {
    async prepare() {
      await fse.remove(output);
    },
    async writeOutput() {
      await fse.ensureDir(assetsDirectory);
      const distStaticDirectory = path.join(distDirectory, `static`);
      await fse.copy(distStaticDirectory, path.join(assetsDirectory, 'static'));

      if (!needModernServer) {
        await copyEntriesHtml(
          modernConfig,
          entrypoints,
          distDirectory,
          assetsDirectory,
        );
      } else {
        await fse.ensureDir(funcsDirectory);
        await copyDeps(distDirectory, funcsDirectory, distStaticDirectory);
      }
    },
    async genEntry() {
      if (!needModernServer) {
        return;
      }
      const handlerTemplate = (
        await fse.readFile(path.join(__dirname, './cf-workers-entry.mjs'))
      ).toString();
      const handlerCode = await generateHandler(
        handlerTemplate,
        appContext,
        modernConfig,
      );
      await fse.writeFile(path.join(funcsDirectory, 'index.js'), handlerCode);
    },
  };
};
