import { pathToFileURL } from 'node:url';
import { get, set } from '@modern-js/utils/lodash';
import { normalizePath } from '../utils';

export const resolveESMDependency = async (entry: string) => {
  const conditions = new Set(['node', 'import', 'module', 'default']);

  try {
    const { moduleResolve } = await import('import-meta-resolve');
    return normalizePath(
      moduleResolve(
        entry,
        pathToFileURL(`${__dirname}/`),
        conditions,
        false,
      ).pathname.replace(/^\/(\w)\:/, '$1:'),
    );
  } catch (err) {
    // ignore
  }
};

export const appendTo = (target: any, key: string, value: any) => {
  const v = get(target, key);
  if (Array.isArray(v)) {
    v.push(value);
  } else {
    set(target, key, [value]);
  }
};
