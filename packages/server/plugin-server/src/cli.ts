import path from 'path';
import type { AppTools, CliPluginFuture } from '@modern-js/app-tools';
import { compile } from '@modern-js/server-utils';
import { SERVER_DIR, SHARED_DIR } from '@modern-js/utils';
import fs from '@modern-js/utils/fs-extra';

function checkHasCache(appDir: string) {
  const tsFilepath = path.resolve(appDir, 'server', 'cache.ts');
  const jsfilepath = path.resolve(appDir, 'server', 'cache.js');

  return fs.existsSync(tsFilepath) || fs.existsSync(jsfilepath);
}

const TS_CONFIG_FILENAME = 'tsconfig.json';

export const serverPlugin = (): CliPluginFuture<AppTools> => ({
  name: '@modern-js/plugin-server',

  setup: async api => {
    api._internalServerPlugins(async ({ plugins }) => {
      plugins.push({
        name: '@modern-js/plugin-server/server',
      });

      return { plugins: plugins };
    });

    api.onAfterBuild(async () => {
      const { appDirectory, distDirectory, moduleType } = api.useAppContext();

      if (checkHasCache(appDirectory)) {
        // If the has server/cache.ts or server/cache.js
        // The app-tools already compiles it,
        // so the plugin-server don't compiles again
        return;
      }

      const modernConfig = api.useResolvedConfigContext();

      const distDir = path.resolve(distDirectory);
      const serverDir = path.resolve(appDirectory, SERVER_DIR);
      const sharedDir = path.resolve(appDirectory, SHARED_DIR);
      const tsconfigPath = path.resolve(appDirectory, TS_CONFIG_FILENAME);

      const sourceDirs = [];
      if (await fs.pathExists(serverDir)) {
        sourceDirs.push(serverDir);

        // compile the sharedDir only when serverDir exists
        if (await fs.pathExists(sharedDir)) {
          sourceDirs.push(sharedDir);
        }
      }

      const { server } = modernConfig;
      const { alias } = modernConfig.source;
      const { babel } = modernConfig.tools;
      if (sourceDirs.length > 0) {
        await compile(
          appDirectory,
          {
            server,
            alias,
            babelConfig: babel,
          },
          {
            sourceDirs,
            distDir,
            tsconfigPath,
            moduleType,
          },
        );
      }
    });
  },
});

export default serverPlugin;
