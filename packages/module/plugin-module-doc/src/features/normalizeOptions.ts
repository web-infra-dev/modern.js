import type { Options } from '../types';

export const normalizeOptions = (options: Options): Required<Options> => {
  const {
    languages = ['zh'],
    doc = {},
    isProduction = process.env.NODE_ENV === 'production',
    appDir = process.cwd(),
    entries = {},
  } = options;
  return {
    languages,
    doc,
    isProduction,
    appDir,
    entries,
  };
};
