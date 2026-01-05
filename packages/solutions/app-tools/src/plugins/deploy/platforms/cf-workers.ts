import path from 'node:path';
import { fs as fse } from '@modern-js/utils';
import {
  NODE_BUILTIN_MODULES,
  bundleSSR,
  copyEntriesHtml,
  generateHandler,
  generateNodeExternals,
  modifyCommonConfig,
  scanDeps,
} from '../edge';
import type { CreatePreset, Setup } from './platform';

export const setupCFWorkers: Setup = async api => {
  modifyCommonConfig(api);
};

export const createCFWorkersPreset: CreatePreset = ({
  appContext,
  modernConfig,
  api,
  needModernServer,
}) => {
  const { appDirectory, distDirectory, entrypoints } = appContext;

  const output = path.join(appDirectory, '.cf-workers');
  const funcsDirectory = path.join(output, 'functions');
  const assetsDirectory = path.join(output, 'assets');
  const distStaticDirectory = path.join(distDirectory, `static`);

  return {
    async prepare() {
      await fse.remove(output);
    },
    async writeOutput() {
      await fse.ensureDir(assetsDirectory);
      await fse.copy(distStaticDirectory, path.join(assetsDirectory, 'static'));

      if (!needModernServer) {
        await copyEntriesHtml(
          modernConfig,
          entrypoints,
          distDirectory,
          assetsDirectory,
        );
      }
    },
    async genEntry() {
      if (!needModernServer) {
        return;
      }
      await fse.ensureDir(funcsDirectory);
      const { code: depCode } = await scanDeps(
        distDirectory,
        appContext.internalDirectory,
        distStaticDirectory,
      );
      const entryTemplate = (
        await fse.readFile(path.join(__dirname, './cf-workers-entry.mjs'))
      ).toString();
      const entryCode = await generateHandler(
        entryTemplate,
        appContext,
        modernConfig,
        depCode,
        'cf-workers',
      );
      const nodeExternals = Object.fromEntries(
        generateNodeExternals(
          api => `module-import node:${api}`,
          NODE_BUILTIN_MODULES,
        ),
      );
      await bundleSSR(entryCode, api, {
        output: {
          externals: [nodeExternals],
          distPath: {
            root: funcsDirectory,
            js: '.',
          },
        },
      });
    },
  };
};
