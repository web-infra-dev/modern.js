import * as path from 'path';
import type { NormalizedConfig } from '@modern-js/core';
import { fs } from '@modern-js/utils';
import { compileByTs } from '../compilers/typescript';
import { compileByBabel } from '../compilers/babel';

export interface Pattern {
  from: string;
  to: string;
  tsconfigPath?: string;
}

export interface IConfig {
  alias?: NormalizedConfig['source']['alias'];
  envVars?: NormalizedConfig['source']['envVars'];
  globalVars?: NormalizedConfig['source']['globalVars'];
  babelConfig?: NormalizedConfig['tools']['babel'];
  server: {
    compiler?: 'babel' | 'typescript';
  };
}

export interface CompileOptions {
  sourceDirs: string[];
  distDir: string;
  tsconfigPath?: string;
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
  const { sourceDirs, distDir, tsconfigPath } = compileOptions;
  validateAbsolutePaths(
    sourceDirs,
    dir => `source dir ${dir} is not an absolute path.`,
  );
  validateAbsolutePath(distDir, `dist dir ${distDir} is not an absolute path.`);

  const compiler = modernConfig?.server?.compiler;

  const isTsProject = tsconfigPath && (await fs.pathExists(tsconfigPath));
  if (!isTsProject || compiler === 'babel') {
    await compileByBabel(appDirectory, modernConfig, compileOptions);
  } else {
    await compileByTs(appDirectory, modernConfig, compileOptions);
  }
};
