import path from 'node:path';
import { lodash as _, fs as fse } from '@modern-js/utils';
import { isMainEntry } from '../../../utils/routes';
import {
  ESM_RESOLVE_CONDITIONS,
  copyDeps,
  generateHandler,
  resolveESMDependency,
} from '../edge-utils';

import type { CreatePreset, Setup } from './platform';

export const setupCFWorkers: Setup = async api => {
  const dep = await resolveESMDependency('@modern-js/prod-server/cf-workers');
  api.modifyRsbuildConfig(config => {
    if (_.get(config, 'environments.node')) {
      _.set(config, 'environments.node.source.entry.modern-server', [dep]);
      _.set(
        config,
        'environments.node.resolve.conditionNames',
        ESM_RESOLVE_CONDITIONS,
      );
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
        const {
          source: { mainEntryName },
        } = modernConfig;
        for (const entry of entrypoints) {
          const isMain = isMainEntry(entry.entryName, mainEntryName);
          const entryFilePath = path.join(
            distDirectory,
            'html',
            entry.entryName,
            'index.html',
          );
          const targetHtml = isMain ? 'index.html' : `${entry.entryName}.html`;
          await fse.copyFile(
            entryFilePath,
            path.join(assetsDirectory, targetHtml),
          );
        }
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
