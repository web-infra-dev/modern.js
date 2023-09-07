import path from 'path';

export const getRequire = () => {
  if ('require' in global && typeof global.require === 'function') {
    return global.require;
  } else {
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    return require('module').createRequire(process.cwd());
  }
};

export const resolveModule = (id: string[] | string) => {
  const exprs = typeof id === 'string' ? id.split('>') : id;
  if (!exprs.length) return null;

  const _require = getRequire();
  let resolved = process.cwd();
  for (const id of exprs) {
    if (path.isAbsolute(id)) {
      resolved = id;
      continue;
    }
    try {
      resolved = _require.resolve(id, { paths: [resolved] });
    } catch (e: any) {
      const stackText = JSON.stringify(exprs, null, 2);
      const err = new Error(
        `Failed to resolve "${id}" from "${resolved}": ${stackText}`,
      );
      err.cause = e;
      throw err;
    }
  }
  return resolved;
};

export const requireModule = (id: string[] | string) => {
  const resolved = resolveModule(id);
  const _require = getRequire();
  return _require(resolved);
};
