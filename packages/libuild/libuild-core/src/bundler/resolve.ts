import { createFilter } from '@rollup/pluginutils';
import { resolvePathAndQuery } from '@modern-js/libuild-utils';
import path from 'path';
import fs from 'fs';
import module from 'module';
import type { BuilderResolveOptions, ILibuilder, SideEffects } from '../types';

const HTTP_PATTERNS = /^(https?:)?\/\//;
const DATAURL_PATTERNS = /^data:/;
const HASH_PATTERNS = /#[^#]+$/;
export const isUrl = (source: string) =>
  HTTP_PATTERNS.test(source) || DATAURL_PATTERNS.test(source) || HASH_PATTERNS.test(source);

function isString(str: unknown): str is string {
  return typeof str === 'string';
}

export function installResolve(compiler: ILibuilder): ILibuilder['resolve'] {
  const { external, sideEffects: userSideEffects } = compiler.config;
  const regExternal = external.filter((item): item is RegExp => !isString(item));
  const externalList = external
    .filter(isString)
    .concat(Object.keys(compiler.config.globals))
    .concat(compiler.config.platform === 'node' ? module.builtinModules : []);

  const externalMap = externalList.reduce((map, item) => {
    map.set(item, true);
    return map;
  }, new Map<string, boolean>());

  function getResolverDir(importer?: string, resolveDir?: string) {
    return resolveDir ?? (importer ? path.dirname(importer) : compiler.config.root);
  }

  function getResolveResult(source: string, opt: BuilderResolveOptions) {
    if (source.endsWith('.css')) {
      return compiler.config.css_resolve(source, getResolverDir(opt.importer, opt.resolveDir));
    }

    return compiler.config.node_resolve(source, getResolverDir(opt.importer, opt.resolveDir), opt.kind);
  }

  function getIsExternal(name: string) {
    if (externalMap.get(name)) {
      return true;
    }

    if (regExternal.some((reg) => reg.test(name))) {
      return true;
    }

    return false;
  }

  /**
   * return module sideEffects
   * @todo fix subpath later
   * @param filePath
   * @param isExternal
   * @returns
   */
  async function getSideEffects(filePath: string | boolean, isExternal: boolean) {
    if (typeof filePath === 'boolean') {
      return false;
    }
    let moduleSideEffects = true;
    let sideEffects: SideEffects | undefined | string[] = userSideEffects;
    let pkgPath = '';
    if (typeof userSideEffects === 'undefined') {
      let curDir = path.dirname(filePath);
      try {
        while (curDir !== path.dirname(curDir)) {
          if (fs.existsSync(path.resolve(curDir, 'package.json'))) {
            pkgPath = path.resolve(curDir, 'package.json');
            break;
          }
          curDir = path.dirname(curDir);
        }
        sideEffects = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).sideEffects;
      } catch (err) {
        // just ignore in case some system permission exception happens
      }
      if (!pkgPath) {
        return undefined;
      }
    }
    if (typeof sideEffects === 'boolean') {
      moduleSideEffects = sideEffects;
    } else if (Array.isArray(sideEffects)) {
      moduleSideEffects = createFilter(
        sideEffects.map((glob) => {
          if (typeof glob === 'string') {
            if (!glob.includes('/')) {
              return `**/${glob}`;
            }
          }
          return glob;
        }),
        null,
        pkgPath
          ? {
              resolve: path.dirname(pkgPath),
            }
          : undefined
      )(filePath);
    } else if (typeof sideEffects === 'function') {
      moduleSideEffects = sideEffects(filePath, isExternal);
    }
    return moduleSideEffects;
  }

  return async (source, options = {}) => {
    if (isUrl(source)) {
      return {
        path: source,
        external: true,
      };
    }

    const { originalFilePath, rawQuery } = resolvePathAndQuery(source);
    const suffix = (rawQuery ?? '').length > 0 ? `?${rawQuery}` : '';
    const isExternal = getIsExternal(originalFilePath);
    const resultPath = isExternal ? originalFilePath : getResolveResult(originalFilePath, options);

    return {
      external: isExternal,
      namespace: isExternal ? undefined : 'file',
      sideEffects: options.skipSideEffects ? false : await getSideEffects(resultPath, isExternal),
      path: resultPath,
      suffix,
    };
  };
}
