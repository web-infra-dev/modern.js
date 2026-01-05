import { pathToFileURL } from 'node:url';
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
