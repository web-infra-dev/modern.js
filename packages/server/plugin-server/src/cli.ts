import fs from 'fs';
import path from 'path';
import type { CliPlugin } from '@modern-js/core';
import { compile } from '@modern-js/server-utils';
import { SHARED_DIR, SERVER_DIR } from '@modern-js/utils';

const TS_CONFIG_FILENAME = 'tsconfig.json';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-server',

  setup: api => ({
    config() {
      return {};
    },
    async afterBuild() {
      const { appDirectory, distDirectory } = api.useAppContext();
      const modernConfig = api.useResolvedConfigContext();

      const distDir = path.resolve(distDirectory);
      const serverDir = path.resolve(appDirectory, SERVER_DIR);
      const sharedDir = path.resolve(appDirectory, SHARED_DIR);
      const tsconfigPath = path.resolve(appDirectory, TS_CONFIG_FILENAME);

      const sourceDirs = [];
      if (fs.existsSync(serverDir)) {
        sourceDirs.push(serverDir);
      }

      if (fs.existsSync(sharedDir)) {
        sourceDirs.push(sharedDir);
      }

      const { server } = modernConfig;
      const { alias, envVars, globalVars } = modernConfig.source;
      const { babel } = modernConfig.tools;

      if (sourceDirs.length > 0) {
        await compile(
          appDirectory,
          {
            server,
            alias,
            envVars,
            globalVars,
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
  }),
});
