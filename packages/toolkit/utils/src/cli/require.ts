import { isAbsolute } from 'node:path';
import { findExists } from './fs';
import { pathToFileURL } from 'node:url';

/**
 * Require function compatible with esm and cjs module.
 * @param path - File to required.
 * @returns module export object.
 */
export async function compatibleRequire(
  path: string,
  interop = true,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
): Promise<any> {
  if (path.endsWith('.json')) {
    return require(path);
  }

  // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
  let requiredModule;
  try {
    requiredModule = require(path);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (err: any) {
    if (err.code === 'ERR_REQUIRE_ESM' || err instanceof SyntaxError) {
      const modulePath = isAbsolute(path) ? pathToFileURL(path).href : path;
      requiredModule = await import(modulePath);
      return interop ? requiredModule.default : requiredModule;
      // biome-ignore lint/style/noUselessElse: <explanation>
    } else {
      throw err;
    }
  }

  return interop && requiredModule?.__esModule
    ? requiredModule.default
    : requiredModule;
}

// Avoid `import` to be tranpiled to `require` by babel/tsc/rollup
export const dynamicImport = new Function(
  'modulePath',
  'return import(modulePath)',
);

export const requireExistModule = async (
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

  return compatibleRequire(exist, final.interop);
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
