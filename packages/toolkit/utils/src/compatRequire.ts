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

// Avoid `import` to be tranpiled to `require` by babel/tsc/rollup
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
export const dynamicImport = new Function(
  'modulePath',
  'return import(modulePath)',
);

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
