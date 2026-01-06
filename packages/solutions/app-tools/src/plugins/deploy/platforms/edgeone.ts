import path from 'node:path';
import { fs as fse } from '@modern-js/utils';
import {
  NODE_BUILTIN_MODULES,
  applyConfig,
  bundleSSR,
  copyEntriesHtml,
  generateHandler,
  generateNodeExternals,
  scanDeps,
  walkDirectory,
} from '../edge';
import type { Setup } from '../types';
import { normalizePath } from '../utils';
import type { CreatePreset } from './platform';

export const setupEdgeOne: Setup = async api => {
  applyConfig(api);
};

export const createEdgeOnePreset: CreatePreset = ({
  appContext,
  modernConfig,
  api,
  needModernServer,
}) => {
  const { appDirectory, distDirectory, entrypoints } = appContext;

  const eoOutput = path.join(appDirectory, '.eo-output');
  const funcsDirectory = path.join(eoOutput, 'node-functions');
  const staticDirectory = path.join(eoOutput, 'static');
  const distStaticDirectory = path.join(distDirectory, `static`);
  return {
    async prepare() {
      await fse.remove(eoOutput);
    },
    async writeOutput() {
      await fse.ensureDir(eoOutput);
      await fse.copy(distStaticDirectory, staticDirectory);

      if (!needModernServer) {
        await copyEntriesHtml(
          modernConfig,
          entrypoints,
          distDirectory,
          eoOutput,
        );
      }
    },
    async genEntry() {
      if (!needModernServer) {
        return;
      }

      const { code: depCode } = await scanDeps(
        distDirectory,
        appContext.internalDirectory,
        distStaticDirectory,
      );

      // generate static file list
      const staticFilesList: string[] = [];
      await walkDirectory(staticDirectory, filePath => {
        staticFilesList.push(
          normalizePath(path.relative(staticDirectory, filePath)),
        );
      });

      const handlerTemplate = (
        await fse.readFile(path.join(__dirname, './edgeone-handler.mjs'))
      ).toString();
      let handlerCode = await generateHandler(
        handlerTemplate,
        appContext,
        modernConfig,
        depCode,
        'edgeone',
      );
      handlerCode = handlerCode.replace(
        'p_genStaticFilesList',
        JSON.stringify(staticFilesList),
      );

      const nodeExternals = Object.fromEntries(
        generateNodeExternals(
          api => `module-import node:${api}`,
          NODE_BUILTIN_MODULES,
        ),
      );
      await bundleSSR(handlerCode, api, {
        output: {
          externals: [nodeExternals],
          distPath: {
            root: funcsDirectory,
            js: '.',
          },
        },
      });

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
