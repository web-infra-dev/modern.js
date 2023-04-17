import path from 'path';
import { fs } from '@modern-js/utils';
import type { Compiler } from 'webpack';

/** The intersection of webpack and Rspack */
export const COMPILATION_PROCESS_STAGE = {
  PROCESS_ASSETS_STAGE_ADDITIONAL: -2000,
  PROCESS_ASSETS_STAGE_PRE_PROCESS: -1000,
  PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE: 700,
  PROCESS_ASSETS_STAGE_SUMMARIZE: 1000,
  PROCESS_ASSETS_STAGE_REPORT: 5000,
};

export const generateScriptTag = () => ({
  tagName: 'script',
  attributes: {
    type: 'text/javascript',
  },
  voidTag: false,
  meta: {},
});

export const getPublicPathFromCompiler = (compiler: Compiler) =>
  typeof compiler.options.output.publicPath === 'string'
    ? compiler.options.output.publicPath
    : // publicPath function is not supported yet
      '/';

export const getBuilderVersion = async (): Promise<string> => {
  const pkgJson = await fs.readJSON(path.join(__dirname, '../../package.json'));
  return pkgJson.version.replace(/\./g, '_');
};
