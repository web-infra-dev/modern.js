import { findExists } from './findExists';

/**
 * Require function compatible with esm and cjs module.
 * @param filePath - File to required.
 * @returns module export object.
 */
export const compatRequire = (filePath: string) => {
  const mod = require(filePath);

  return mod?.__esModule ? mod.default : mod;
};

export const requireExistModule = (
  filename: string,
  extensions = ['.ts', '.js'],
) => {
  const exist = findExists(extensions.map(ext => `${filename}${ext}`));

  if (!exist) {
    return null;
  }

  return compatRequire(exist);
};

export const cleanRequireCache = (filelist: string[]) => {
  filelist.forEach(filepath => {
    delete require.cache[filepath];
  });
};
