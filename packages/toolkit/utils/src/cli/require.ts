import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { findExists } from './fs';

/**
 * Require function compatible with esm and cjs module.
 * @param path - File to required.
 * @returns module export object.
 */
export async function compatibleRequire(
  path: string,
  interop = true,
): Promise<any> {
  if (path.endsWith('.json')) {
    return require(path);
  }

  let requiredModule;
  try {
    requiredModule = require(path);
  } catch (err: any) {
    if (err.code === 'ERR_REQUIRE_ESM') {
      const modulePath = isAbsolute(path) ? pathToFileURL(path).href : path;
      if (process.env.NODE_ENV === 'development') {
        const timestamp = Date.now();

        requiredModule = await import(`${modulePath}?t=${timestamp}`);
      } else {
        requiredModule = await import(modulePath);
      }
      return interop ? requiredModule.default : requiredModule;
    } else {
      throw err;
    }
  }

  return interop && requiredModule?.__esModule
    ? requiredModule.default
    : requiredModule;
}

export async function loadFromProject(moduleName: string, appDir: string) {
  let requiredModule;
  const paths = [appDir, process.cwd()];

  try {
    if (typeof require !== 'undefined') {
      const modulePath = require.resolve(moduleName, { paths });
      requiredModule = require(modulePath);
    } else {
      //@ts-ignore
      const { createRequire } = await import('node:module');
      //@ts-ignore
      const require = createRequire(import.meta.url);
      const modulePath = require.resolve(moduleName, { paths });
      const moduleUrl = pathToFileURL(modulePath).href;
      requiredModule = await import(moduleUrl);
    }

    return requiredModule.default || requiredModule;
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error(`Cannot find module ${moduleName}.`);
    }
    throw error;
  }
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
    if (typeof require !== 'undefined' && require.cache) {
      delete require.cache[filepath];
    }
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
