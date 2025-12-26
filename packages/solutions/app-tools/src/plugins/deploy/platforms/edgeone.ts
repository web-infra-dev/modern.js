import path from 'node:path';
import { fs as fse } from '@modern-js/utils';
import { getServerPlugins } from '../../../utils/loadPlugins';
import {
  copyDeps,
  copyEntriesHtml,
  generateHandler,
  generateProdServerEntry,
  modifyCommonConfig,
  normalizePath,
  walkDirectory,
} from '../edge-utils';
import type { CreatePreset, Setup } from './platform';

export const setupEdgeOne: Setup = async api => {
  api.generateEntryCode(async () => {
    await getServerPlugins(api);
    await generateProdServerEntry(api.getAppContext(), 'edgeone');
  });
  modifyCommonConfig(api);
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
        await copyEntriesHtml(
          modernConfig,
          entrypoints,
          distDirectory,
          eoOutput,
        );
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
      const entryCode = (
        await fse.readFile(path.join(__dirname, './edgeone-entry.mjs'))
      ).toString();
      await fse.writeFile(path.join(funcsDirectory, 'index.js'), entryCode);
      await fse.writeFile(
        path.join(funcsDirectory, '[[default]].js'),
        entryCode,
      );
    },
  };
};
