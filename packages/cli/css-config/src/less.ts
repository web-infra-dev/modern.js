import type { NormalizedConfig } from '@modern-js/core';
import { applyOptionsChain } from '@modern-js/utils';

export interface LessOptions {
  lessOptions?: {
    sourceMap?: {
      sourceMapURL?: string;
      sourceMapBasepath?: string;
      sourceMapRootpath?: string;
      outputSourceFiles?: boolean;
      sourceMapFileInline?: boolean;
    };

    /** Filename of the main file to be passed to less.render() */
    filename?: string;

    /** The locations for less looking for files in @import rules */
    paths?: string[];

    /** True, if run the less parser and just reports errors without any output. */
    lint?: boolean;

    /** Pre-load global Less.js plugins */
    plugins?: Plugin[];

    /** @deprecated If true, compress using less built-in compression. */
    compress?: boolean;
    strictImports?: boolean;

    /** If true, allow imports from insecure https hosts. */
    insecure?: boolean;
    depends?: boolean;
    maxLineLen?: number;

    /** @deprecated If false, No color in compiling. */
    color?: boolean;

    /** @deprecated False by default. */
    ieCompat?: boolean;

    /** @deprecated If true, enable evaluation of JavaScript inline in `.less` files. */
    javascriptEnabled?: boolean;

    /** Whether output file information and line numbers in compiled CSS code. */
    dumpLineNumbers?: 'comment' | string;

    /** Add a path to every generated import and url in output css files. */
    rootpath?: string;

    /** Math mode options for avoiding symbol conficts on math expressions. */
    math?:
      | 'always'
      | 'strict'
      | 'parens-division'
      | 'parens'
      | 'strict-legacy'
      | number;

    /** If true, stops any warnings from being shown. */
    silent?: boolean;

    /** Without this option, Less attempts to guess at the output unit when it does maths. */
    strictUnits?: boolean;

    /** Defines a variable that can be referenced by the file. */
    globalVars?: {
      [key: string]: string;
    };

    /** Puts Var declaration at the end of base file. */
    modifyVars?: {
      [key: string]: string;
    };

    /** Read files synchronously in Node.js */
    syncImport?: boolean;
  };
  additionalData?: string | ((content: string, filename: string) => string);
  sourceMap?: boolean;
  implementation?: string;
  webpackImorter?: string;
}

export const getLessConfig = (
  config: NormalizedConfig,
  options: LessOptions = {},
) =>
  applyOptionsChain(
    {
      lessOptions: { javascriptEnabled: true },
      sourceMap: false,
      ...options,
    },
    (config.tools as any).less,
  );
