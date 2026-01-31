import path, { join } from 'node:path';
import {
  chalk,
  fs as fse,
  removeModuleSyncFromExports,
} from '@modern-js/utils';
import { nodeDepEmit as handleDependencies } from 'ndepe';
import {
  NODE_BUILTIN_MODULES,
  bundleServer,
  generateHandler as generateSingleBundleHandler,
} from '../server-bundle';
import { scanDeps } from '../server-bundle/dep-generator';
import { readTemplate } from '../utils';
import { generateHandler } from '../utils/generator';
import type { CreatePreset } from './platform';

export const createNodePreset: CreatePreset = ({
  appContext,
  modernConfig,
  api,
}) => {
  const { appDirectory, distDirectory, serverPlugins, moduleType, metaName } =
    appContext;
  const isEsmProject = moduleType === 'module';

  const isBundleServer =
    typeof modernConfig?.server?.ssr === 'object' &&
    modernConfig.server.ssr.bundleServer;

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
      if (!isBundleServer) {
        const handlerTemplate = await readTemplate(
          `node-entry.${isEsmProject ? 'mjs' : 'cjs'}`,
        );

        const code = await generateHandler({
          template: handlerTemplate,
          appContext,
          config: modernConfig,
        });

        await fse.writeFile(entryFilePath, code);
        return;
      }

      const handlerTemplate = await readTemplate('node-entry-bundle.mjs');

      const { code: depCode } = await scanDeps(
        distDirectory,
        appContext.internalDirectory,
        [
          path.join(distDirectory, 'static'),
          path.join(distDirectory, 'bundles'),
        ],
      );
      const code = await generateSingleBundleHandler({
        template: handlerTemplate,
        appContext,
        config: modernConfig,
        depCode,
        serverType: 'node',
      });
      await bundleServer(code, api, {
        nodeExternal: NODE_BUILTIN_MODULES,
        config: {
          output: {
            distPath: {
              root: join(appDirectory, '.output-server-bundle'),
              js: '.',
            },
          },
        },
      });
    },
    async end() {
      if (!isBundleServer) {
        const filter = (filePath: string) => {
          return (
            !filePath.startsWith(staticDirectory) && !filePath.endsWith('.map')
          );
        };
        // Because @modern-js/prod-server is an implicit dependency of the entry, so we add it to the include here.
        await handleDependencies({
          appDir: appDirectory,
          sourceDir: outputDirectory,
          includeEntries: [require.resolve('@modern-js/prod-server')],
          copyWholePackage(pkgName) {
            return pkgName === '@modern-js/utils';
          },
          entryFilter: filter,
          transformPackageJson: ({ pkgJSON }) => {
            if (!pkgJSON.exports) {
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
      }
      console.log(
        'Static directory:',
        chalk.blue(path.relative(appDirectory, staticDirectory)),
      );
      if (isBundleServer) {
        console.log(
          `You can preview this build by`,
          chalk.blue(`node .output-server-bundle/bundle.mjs`),
        );
      } else {
        console.log(
          `You can preview this build by`,
          chalk.blue(`node .output/index`),
        );
      }
    },
  };
};
