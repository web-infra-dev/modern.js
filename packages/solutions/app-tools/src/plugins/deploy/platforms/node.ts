import path from 'node:path';
import {
  chalk,
  fs as fse,
  removeModuleSyncFromExports,
} from '@modern-js/utils';
import { nodeDepEmit as handleDependencies } from 'ndepe';
import { readTemplate, resolveESMDependency } from '../utils';
import { generateHandler } from '../utils/generator';
import type { CreatePreset } from './platform';

export const createNodePreset: CreatePreset = ({
  appContext,
  modernConfig,
  api,
}) => {
  const { appDirectory, distDirectory, moduleType } = appContext;
  const isEsmProject = moduleType === 'module';

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
      const template = await readTemplate(
        `node-entry.${isEsmProject ? 'mjs' : 'cjs'}`,
      );

      const code = await generateHandler({
        template,
        appContext,
        config: modernConfig,
        isESM: isEsmProject,
      });

      await fse.writeFile(entryFilePath, code);
    },
    async end() {
      const filter = (filePath: string) => {
        return (
          !filePath.startsWith(staticDirectory) && !filePath.endsWith('.map')
        );
      };
      // Because @modern-js/prod-server is an implicit dependency of the entry, so we add it to the include here.
      const entry = isEsmProject
        ? await resolveESMDependency('@modern-js/prod-server')
        : require.resolve('@modern-js/prod-server');
      if (!entry) {
        throw new Error('Cannot find @modern-js/prod-server');
      }
      await handleDependencies({
        appDir: appDirectory,
        sourceDir: outputDirectory,
        includeEntries: [entry],
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
      console.log(
        'Static directory:',
        chalk.blue(
          path.relative(appDirectory, staticDirectory).replace(/\\/g, '/'),
        ),
      );
      console.log(
        `You can preview this build by`,
        chalk.blue('node .output/index'),
      );
    },
  };
};
