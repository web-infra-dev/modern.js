import path from 'path';
import fs from 'fs';
import { SERVER_DIR, SHARED_DIR } from '@modern-js/utils';
import { compile } from '@modern-js/server-utils';
import { CliPlugin, AppTools } from '../types';

const TS_CONFIG_FILENAME = 'tsconfig.json';

function checkHasCache(appDir: string) {
  const tsFilepath = path.resolve(appDir, 'server', 'cache.ts');
  const jsfilepath = path.resolve(appDir, 'server', 'cache.js');

  return fs.existsSync(tsFilepath) || fs.existsSync(jsfilepath);
}

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/server-build',

  setup(api) {
    return {
      async afterBuild() {
        const { appDirectory, distDirectory } = api.useAppContext();
        if (!checkHasCache(appDirectory)) {
          return;
        }
        const modernConfig = api.useResolvedConfigContext();

        const distDir = path.resolve(distDirectory);
        const serverDir = path.resolve(appDirectory, SERVER_DIR);
        const sharedDir = path.resolve(appDirectory, SHARED_DIR);
        const tsconfigPath = path.resolve(appDirectory, TS_CONFIG_FILENAME);

        const sourceDirs = [];
        if (fs.existsSync(serverDir)) {
          sourceDirs.push(serverDir);

          // compile the sharedDir only when serverDir exists
          if (fs.existsSync(sharedDir)) {
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
            },
          );
        }
      },
    };
  },
});
