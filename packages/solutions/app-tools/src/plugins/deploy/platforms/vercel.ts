import path from 'node:path';
import { fs as fse, removeModuleSyncFromExports } from '@modern-js/utils';
import { nodeDepEmit as handleDependencies } from 'ndepe';
import { isMainEntry } from '../../../utils/routes';
import { getTemplatePath, readTemplate } from '../utils';
import { type PluginItem, generateHandler } from '../utils/generator';
import type { CreatePreset } from './platform';

export const createVercelPreset: CreatePreset = ({
  appContext,
  modernConfig,
  needModernServer,
}) => {
  const {
    appDirectory,
    distDirectory,
    entrypoints,
    serverPlugins,
    moduleType,
    metaName,
  } = appContext;
  const isEsmProject = moduleType === 'module';

  const plugins: PluginItem[] = serverPlugins.map(plugin => [
    plugin.name,
    plugin.options,
  ]);

  const vercelOutput = path.join(appDirectory, '.vercel');
  const outputDirectory = path.join(vercelOutput, 'output');
  const funcsDirectory = path.join(outputDirectory, 'functions', 'index.func');
  const entryFilePath = path.join(funcsDirectory, 'index.js');
  const handlerFilePath = path.join(funcsDirectory, 'vercel-handler.cjs');
  return {
    async prepare() {
      await fse.remove(vercelOutput);
    },
    async writeOutput() {
      const config: Record<string, any> = {
        version: 3,
        routes: [
          {
            src: '/static/(.*)',
            headers: {
              'cache-control': 's-maxage=31536000, immutable',
            },
            continue: true,
          },
          {
            handle: 'filesystem',
          },
        ],
      };

      if (!needModernServer) {
        const {
          source: { mainEntryName },
          html: { outputStructure },
        } = modernConfig;
        entrypoints.forEach(entry => {
          const isMain = isMainEntry(entry.entryName, mainEntryName);
          const htmlPath =
            outputStructure === 'flat'
              ? `/html/${entry.entryName}.html`
              : `/html/${entry.entryName}/index.html`;
          config.routes.push({
            src: `/${isMain ? '' : entry.entryName}(?:/.*)?`,
            headers: { 'cache-control': 's-maxage=0' },
            dest: htmlPath,
          });
        });
      } else {
        config.routes.push({
          src: '/(.*)',
          dest: `/index`,
        });
      }

      await fse.ensureDir(outputDirectory);
      await fse.writeJSON(path.join(outputDirectory, 'config.json'), config, {
        spaces: 2,
      });

      const staticDirectory = path.join(outputDirectory, 'static/static');
      await fse.copy(path.join(distDirectory, 'static'), staticDirectory);
      if (!needModernServer) {
        const destHtmlDirectory = path.join(distDirectory, 'html');
        const outputHtmlDirectory = path.join(
          path.join(outputDirectory, 'static'),
          'html',
        );
        await fse.copy(destHtmlDirectory, outputHtmlDirectory);
      } else {
        await fse.ensureDir(funcsDirectory);
        await fse.copy(distDirectory, funcsDirectory, {
          filter: (src: string) => {
            const distStaticDirectory = path.join(distDirectory, 'static');
            return !src.includes(distStaticDirectory);
          },
        });

        const nodeVersion = process.versions.node.split('.')[0];

        await fse.writeJSON(path.join(funcsDirectory, '.vc-config.json'), {
          runtime: `nodejs${nodeVersion}.x`,
          handler: 'index.js',
          launcherType: 'Nodejs',
          shouldAddHelpers: false,
          supportsResponseStreaming: true,
        });
      }
    },
    async genEntry() {
      if (!needModernServer) {
        return;
      }

      let handlerCode = await readTemplate('vercel-handler.cjs');

      handlerCode = await generateHandler({
        template: handlerCode,
        appContext,
        config: modernConfig,
      });

      await fse.writeFile(handlerFilePath, handlerCode);
      if (isEsmProject) {
        // We will not modify the entry file for the time, because we have not yet converted all the packages available for esm.
        await fse.copy(getTemplatePath('vercel-entry.mjs'), entryFilePath);
      } else {
        await fse.copy(getTemplatePath('vercel-entry.cjs'), entryFilePath);
      }
    },
    async end() {
      if (!needModernServer) {
        return;
      }
      await handleDependencies({
        appDir: appDirectory,
        sourceDir: funcsDirectory,
        includeEntries: [require.resolve('@modern-js/prod-server')],
        copyWholePackage(pkgName) {
          return pkgName === '@modern-js/utils';
        },
        transformPackageJson: ({ pkgJSON }) => {
          if (!pkgJSON.exports || typeof pkgJSON.exports !== 'object') {
            return pkgJSON;
          }

          return {
            ...pkgJSON,
            exports: removeModuleSyncFromExports(
              pkgJSON.exports as Record<string, any>,
            ),
          };
        },
      });
    },
  };
};
