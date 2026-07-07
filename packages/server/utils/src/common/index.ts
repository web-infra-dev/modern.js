import * as path from 'path';
import type {
  SourceNormalizedConfig,
  ToolsNormalizedConfig,
} from '@modern-js/server-core';
import { fs } from '@modern-js/utils';
import type ts from 'typescript';

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

export type DeclarationTransformerFactory = (
  tsInstance: typeof ts,
) => ts.TransformerFactory<ts.SourceFile | ts.Bundle>;

export interface CompileOptions {
  sourceDirs: string[];
  distDir: string;
  tsconfigPath?: string;
  moduleType?: 'module' | 'commonjs';
  throwErrorInsteadOfExit?: boolean;
  /**
   * Custom transformers applied to declaration emit (tsc
   * `afterDeclarations`), so callers can shape the generated d.ts at the
   * point it is produced.
   */
  declarationTransformers?: DeclarationTransformerFactory[];
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

  const { compileByTs } = await import('../compilers/typescript');
  await compileByTs(appDirectory, modernConfig, compileOptions);
};
