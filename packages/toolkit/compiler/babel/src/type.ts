import type { TransformOptions } from '@babel/core';
import type { GlobOptions } from '@modern-js/utils';

export type BabelOptions = TransformOptions;
export type Extensions = string[];
export type ExtensionsFunc = (defaultExtensions: Extensions) => Extensions;

export interface ICompilerOptions {
  rootDir: string;
  distDir: string;
  sourceDir?: string;
  watchDir?: string;
  enableWatch?: boolean;
  enableVirtualDist?: boolean;
  extensions?: Extensions | ExtensionsFunc;
  filenames?: string[];
  distFileExtMap?: Record<string, string>;
  ignore?: GlobOptions['ignore'];
  quiet?: boolean;
  verbose?: boolean;
  clean?: boolean;
}

export interface ICompilerOptionsWithDefault {
  rootDir: string;
  enableVirtualDist?: boolean;
  sourceDir?: string;
  watchDir?: string;
  enableWatch?: boolean;
  distDir: string;
  extensions: Extensions | ExtensionsFunc;
  filenames: string[];
  distFileExtMap?: Record<string, string>;
  ignore: GlobOptions['ignore'];
  quiet?: boolean;
  verbose?: boolean;
  clean?: boolean;
}

export interface IFinaleCompilerOptions {
  rootDir: string;
  filenames: string[];
  ignore?: GlobOptions['ignore'];
  enableVirtualDist?: boolean;
  distDir: string;
  watchDir?: string;
  enableWatch?: boolean;
  distFileExtMap?: Record<string, string>;
  quiet?: boolean;
  verbose?: boolean;
  clean?: boolean;
}

export interface BuildOptions {
  babelOptions: BabelOptions;
}

export interface IVirtualDist {
  distPath: string;
  sourceMapPath: string;
  code: string;
  sourcemap: string;
}

export interface ICompilerMessageDetail {
  filename: string;
  content: string;
}

export interface ICompilerResult {
  code: number;
  message: string;
  messageDetails?: ICompilerMessageDetail[];
  virtualDists?: IVirtualDist[];
  removeFiles?: string[];
}
