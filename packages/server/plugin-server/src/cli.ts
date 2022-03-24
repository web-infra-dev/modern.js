import fs from 'fs';
import path from 'path';
import type { NormalizedConfig, CliPlugin } from '@modern-js/core';
import { compiler } from '@modern-js/babel-compiler';
import { resolveBabelConfig } from '@modern-js/server-utils';
import { SHARED_DIR, SERVER_DIR } from '@modern-js/utils';

const TS_CONFIG_FILENAME = 'tsconfig.json';
const FILE_EXTENSIONS = ['.js', '.ts', '.mjs', '.ejs'];

interface Pattern {
  from: string;
  to: string;
  tsconfigPath?: string;
}

interface CompileOptions {
  patterns: Pattern[];
}

const compile = async (
  appDirectory: string,
  modernConfig: NormalizedConfig,
  compileOptions: CompileOptions,
) => {
  const { patterns } = compileOptions;
  const results = await Promise.all(
    patterns.map(pattern => {
      const { from, to, tsconfigPath } = pattern;
      const babelConfig = resolveBabelConfig(appDirectory, modernConfig, {
        tsconfigPath: tsconfigPath ? tsconfigPath : '',
        syntax: 'es6+',
        type: 'commonjs',
      });
      return compiler(
        {
          rootDir: appDirectory,
          distDir: to,
          sourceDir: from,
          extensions: FILE_EXTENSIONS,
        },
        babelConfig,
      );
    }),
  );
  results.forEach(result => {
    if (result.code === 1) {
      throw new Error(result.message);
    }
  });
};

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

      const patterns = [];
      if (fs.existsSync(serverDir)) {
        patterns.push({
          from: serverDir,
          to: distDir,
          tsconfigPath,
        });
      }

      if (fs.existsSync(sharedDir)) {
        patterns.push({
          from: sharedDir,
          to: distDir,
          tsconfigPath,
        });
      }

      if (patterns.length > 0) {
        await compile(appDirectory, modernConfig, { patterns });
      }
    },
  }),
});
