import * as path from 'path';
import type {
  SourceNormalizedConfig,
  ToolsNormalizedConfig,
} from '@modern-js/server-core';
import { fs } from '@modern-js/utils';

export interface Pattern {
  from: string;
  to: string;
  tsconfigPath?: string;
}

export interface IConfig {
  alias?: SourceNormalizedConfig['alias'];
  babelConfig?: ToolsNormalizedConfig['babel'];
  server: {
    compiler?: 'babel' | 'typescript';
  };
}

export interface CompileOptions {
  sourceDirs: string[];
  distDir: string;
  tsconfigPath?: string;
  moduleType?: 'module' | 'commonjs';
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
    const { compileByBabel } = await import('../compilers/babel');
    await compileByBabel(appDirectory, modernConfig, compileOptions);
  } else {
    const { compileByTs } = await import('../compilers/typescript');
    await compileByTs(appDirectory, modernConfig, compileOptions);
  }
};
