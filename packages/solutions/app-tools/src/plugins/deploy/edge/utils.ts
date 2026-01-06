import { pathToFileURL } from 'node:url';
import { lodash as _ } from '@modern-js/utils';
import { moduleResolve } from 'import-meta-resolve';
import { normalizePath } from '../utils';

export const resolveESMDependency = (entry: string) => {
  const conditions = new Set(['node', 'import', 'module', 'default']);
  try {
    return normalizePath(
      moduleResolve(
        entry,
        pathToFileURL(`${__dirname}/`),
        conditions,
        false,
      ).href.replace(/^file:[\/]+/, ''),
    );
  } catch (err) {
    // ignore
  }
};

export const appendTo = (target: any, key: string, value: any) => {
  const v = _.get(target, key);
  if (Array.isArray(v)) {
    v.push(value);
  } else {
    _.set(target, key, [value]);
  }
};
