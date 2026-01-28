import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { moduleResolve } from 'import-meta-resolve';
import { findExists } from './fs';

async function importPath(path: string, options?: any) {
  const modulePath = isAbsolute(path) ? pathToFileURL(path).href : path;
  if (process.env.NODE_ENV === 'development') {
    const timestamp = Date.now();
    // @ts-ignore
    return await import(`${modulePath}?t=${timestamp}`, options);
  } else {
    // @ts-ignore
    return await import(modulePath, options);
  }
}

/**
 * Require function compatible with esm and cjs module.
 * @param path - File to required.
 * @returns module export object.
 */

async function compatibleRequireESM(
  path: string,
  interop = true,
): Promise<any> {
  if (path.endsWith('.json')) {
    const res = await importPath(path, {
      with: { type: 'json' },
    });
    return res.default;
  }

  const requiredModule = await importPath(path);
  return interop ? requiredModule.default : requiredModule;
}

async function compatibleRequireCJS(
  path: string,
  interop = true,
): Promise<any> {
  if (path.endsWith('.json')) {
    return require(path);
  }

  try {
    const requiredModule = require(path);
    return interop && requiredModule?.__esModule
      ? requiredModule.default
      : requiredModule;
  } catch (err: any) {
    if (err.code === 'ERR_REQUIRE_ESM') {
      return await compatibleRequireESM(path, interop);
    } else {
      throw err;
    }
  }
}

export async function compatibleRequire(
  path: string,
  interop = true,
): Promise<any> {
  if (process.env.MODERN_LIB_FORMAT === 'esm') {
    return await compatibleRequireESM(path, interop);
  } else {
    return await compatibleRequireCJS(path, interop);
  }
}

export async function loadFromProject(moduleName: string, appDir: string) {
  let requiredModule;
  const paths = [appDir, process.cwd()];

  try {
    const modulePath = tryResolve(moduleName, ...paths);
    if (process.env.MODERN_LIB_FORMAT === 'esm') {
      const moduleUrl = pathToFileURL(modulePath).href;
      requiredModule = await import(moduleUrl);
    } else {
      requiredModule = require(modulePath);
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
  if (process.env.MODERN_LIB_FORMAT !== 'esm') {
    filelist.forEach(filepath => {
      if (typeof require !== 'undefined' && require.cache) {
        delete require.cache[filepath];
      }
    });
  }
};

/**
 * Try to resolve npm package entry file path.
 * @param name - Package name.
 * @param resolvePath - Path to resolve dependencies.
 * @returns Resolved file path.
 */
const tryResolveESM = (name: string, ...resolvePath: string[]) => {
  const conditions = new Set(['node', 'import', 'module', 'default']);
  for (const p of resolvePath) {
    try {
      return moduleResolve(
        name,
        pathToFileURL(`${p}/`),
        conditions,
        false,
      ).pathname.replace(/^\/(\w)\:/, '$1:');
    } catch (err) {
      // ignore
    }
  }
  const err = new Error(`Can not find module ${name}.`);
  (err as any).code = 'MODULE_NOT_FOUND';
  throw err;
};

export const tryResolve = (name: string, ...resolvePath: string[]) => {
  let filePath = '';
  try {
    if (process.env.MODERN_LIB_FORMAT === 'esm') {
      filePath = tryResolveESM(name, ...resolvePath);
    } else {
      filePath = require.resolve(name, { paths: resolvePath });
      delete require.cache[filePath];
    }
  } catch (err) {
    if ((err as any).code === 'MODULE_NOT_FOUND') {
      throw new Error(`Can not find module ${name}.`);
    }
    throw err;
  }
  return filePath;
};
