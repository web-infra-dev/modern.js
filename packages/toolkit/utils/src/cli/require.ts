import { findExists } from './fs';

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

export function deleteRequireCache(path: string) {
  if (require.cache[path]) {
    delete require.cache[path];
  }
  if (module.children) {
    module.children = module.children.filter(item => item.filename !== path);
  }
}

/**
 * Try to resolve npm package entry file path.
 * @param name - Package name.
 * @param resolvePath - Path to resolve dependencies.
 * @returns Resolved file path.
 */
export const tryResolve = (name: string, resolvePath: string) => {
  let filePath = '';
  try {
    filePath = require.resolve(name, { paths: [resolvePath] });
    delete require.cache[filePath];
  } catch (err) {
    if ((err as any).code === 'MODULE_NOT_FOUND') {
      throw new Error(`Can not find module ${name}.`);
    }
    throw err;
  }
  return filePath;
};
