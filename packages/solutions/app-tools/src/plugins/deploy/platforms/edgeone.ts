import path from 'node:path';
import { lodash as _, fs as fse } from '@modern-js/utils';
import { isMainEntry } from '../../../utils/routes';
import {
  ESM_RESOLVE_CONDITIONS,
  copyDeps,
  generateHandler,
  normalizePath,
  resolveESMDependency,
  walkDirectory,
} from '../edge-utils';

import type { CreatePreset, Setup } from './platform';

export const setupEdgeOne: Setup = async api => {
  const dep = await resolveESMDependency('@modern-js/prod-server/edgeone');
  api.modifyRsbuildConfig(config => {
    if (_.get(config, 'environments.node')) {
      _.set(config, 'environments.node.source.entry.modern-server', [dep]);
      _.set(
        config,
        'environments.node.resolve.conditionNames',
        ESM_RESOLVE_CONDITIONS,
      );
    }
    return config;
  });
};

export const createEdgeOnePreset: CreatePreset = (
  appContext,
  modernConfig,
  needModernServer,
) => {
  const { appDirectory, distDirectory, entrypoints } = appContext;

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
          await fse.copyFile(entryFilePath, path.join(eoOutput, targetHtml));
        }
      } else {
        await fse.ensureDir(funcContentDirectory);
        await copyDeps(
          distDirectory,
          funcContentDirectory,
          distStaticDirectory,
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
      const handlerTemplate = (
        await fse.readFile(path.join(__dirname, './edgeone-handler.mjs'))
      ).toString();
      const handlerCode = await generateHandler(
        handlerTemplate,
        appContext,
        modernConfig,
      );
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
