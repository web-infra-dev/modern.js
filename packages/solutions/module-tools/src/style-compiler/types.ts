import { LessOption, SassOption, PostcssOption } from '@modern-js/core';

export type { BuildWatchEmitter } from './build-watch';

export interface Option {
  less?: LessOption;
  sass?: SassOption;
  postcss?: PostcssOption;
}

export interface ResolveItemParams {
  file: string;
  projectDir: string;
  stylesDir: string;
  outDir: string;
  enableVirtualDist: boolean;
  options: Option;
}

export type ResolveParams = Omit<ResolveItemParams, 'file'> & {
  files: string[];
};

export type ProjectOption = Omit<ResolveItemParams, 'file' | 'options'>;

export interface SingleFileCompilerResult {
  code: number; // 0 success, 1 fail
  filename: string;
  content: string;
  error: string | null;
  sourceMapFileName?: string;
  sourceMap?: string;
}

export interface ICompilerResult {
  dists: SingleFileCompilerResult[];
  errors: SingleFileCompilerResult[];
  code: number;
}

export interface IBuildOption {
  projectDir: string;
  stylesDir: string;
  outDir: string;
  enableVirtualDist?: boolean;
  compilerOption?: Option;
}
