import { findExists } from './findExists';

/**
 * Require function compatible with esm and cjs module.
 * @param filePath - File to required.
 * @returns module export object.
 */
export const compatRequire = (filePath: string, interop = true) => {
  const mod = require(filePath);
  const rtnESMDefault = interop && mod?.__esModule;

  return rtnESMDefault ? mod.default : mod;
};

export const requireExistModule = (
  filename: string,
  opt?: {
    extensions?: string[];
    interop?: boolean;
  },
) => {
  const final = {
    extensions: ['.ts', '.js'],
    interop: true,
    ...opt,
  };
  const exist = findExists(final.extensions.map(ext => `${filename}${ext}`));
  if (!exist) {
    return null;
  }

  return compatRequire(exist, final.interop);
};

export const cleanRequireCache = (filelist: string[]) => {
  filelist.forEach(filepath => {
    delete require.cache[filepath];
  });
};
