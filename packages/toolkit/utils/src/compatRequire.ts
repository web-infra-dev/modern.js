/**
 * Require function compatible with esm and cjs module.
 * @param filePath - File to required.
 * @returns module export object.
 */
export const compatRequire = (filePath: string) => {
  const mod = require(filePath);

  return mod?.__esModule ? mod.default : mod;
};
