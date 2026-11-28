import * as path from 'path';
import type { SourceNormalizedConfig } from '@modern-js/server-core';

export interface Pattern {
  from: string;
  to: string;
  tsconfigPath?: string;
}

export interface IConfig {
  alias?: SourceNormalizedConfig['alias'];
  server?: {
    compiler?: 'typescript';
  };
}

export interface CompileOptions {
  sourceDirs: string[];
  distDir: string;
  tsconfigPath?: string;
  moduleType?: 'module' | 'commonjs';
  throwErrorInsteadOfExit?: boolean;
  /**
   * Absolute paths of files that must be emitted, such as `server/<meta>.server.ts`
   * and `server/cache.ts`. They are compiled even when the tsconfig does not include
   * them, and the compile fails if their JavaScript output is missing.
   */
  entries?: string[];
}

export type CompileFunc = (
  appDirectory: string,
  modernConfig: IConfig,
  compileOptions: CompileOptions,
) => Promise<void>;

export const FILE_EXTENSIONS = ['.js', '.ts', '.mjs', '.ejs'];

const validateAbsolutePath = (filename: string, message: string) => {
  if (!path.isAbsolute(filename)) {
    throw new Error(message);
  }
};

const validateAbsolutePaths = (
  filenames: string[],
  messageFunc: (filename: string) => string,
) => {
  filenames.forEach(filename =>
    validateAbsolutePath(filename, messageFunc(filename)),
  );
};

export const compile: CompileFunc = async (
  appDirectory,
  modernConfig,
  compileOptions,
) => {
  const { sourceDirs, distDir } = compileOptions;
  validateAbsolutePaths(
    sourceDirs,
    dir => `source dir ${dir} is not an absolute path.`,
  );
  validateAbsolutePath(distDir, `dist dir ${distDir} is not an absolute path.`);

  const { compileByTs } = await import('../compilers/typescript');
  await compileByTs(appDirectory, modernConfig, compileOptions);
};
