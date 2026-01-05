import path from 'node:path';
import { lodash as _, fs as fse } from '@modern-js/utils';
import { getServerPlugins } from '../../../utils/loadPlugins';
import {
  NODE_BUILTIN_MODULES,
  copyDeps,
  copyEntriesHtml,
  generateHandler,
  generateNodeExternals,
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
  const nodeExternals = Object.fromEntries(
    generateNodeExternals(
      api => `module-import node:${api}`,
      NODE_BUILTIN_MODULES,
    ),
  );
  api.modifyRsbuildConfig(config => {
    if (_.get(config, 'environments.node')) {
      // polyfill __nccwpck_require__
      _.set(config, 'environments.node.source.define.__dirname', "'/bundle'");
    }
    return config;
  });
  api.modifyRspackConfig(options => {
    if (
      options.target === 'node' &&
      api.getAppContext().moduleType === 'module'
    ) {
      // do not need rspack polyfill in esm projects
      _.set(options, 'experiments.outputModule', true);
      _.set(options, 'output.library.type', 'module');
      _.set(options, 'target', 'es2020');
      const externals = _.get(options, 'externals');
      if (Array.isArray(externals)) {
        externals.push(nodeExternals);
      } else {
        _.set(options, 'externals', [nodeExternals]);
      }
    }
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
