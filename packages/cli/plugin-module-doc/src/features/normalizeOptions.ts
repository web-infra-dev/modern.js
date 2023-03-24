import type { Options } from '../types';

export const normalizeOptions = (options: Options): Required<Options> => {
  const {
    languages = ['zh'],
    doc = {},
    demosDir = './demos',
    isProduction = process.env.NODE_ENV === 'production',
    appDir = process.cwd(),
    tsParseTool = 'ts-document',
    docgenDir = './node_modules/.docs',
    isTsProject = true,
    entries = {},
    useTemplate = true,
  } = options;
  return {
    languages,
    doc,
    demosDir,
    isProduction,
    appDir,
    tsParseTool,
    docgenDir,
    isTsProject,
    entries,
    useTemplate,
  };
};
