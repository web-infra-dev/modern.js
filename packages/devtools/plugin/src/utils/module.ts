import assert from 'assert';
import module from 'module';
import path from 'path';

export const getRequire = (): NodeRequire => {
  try {
    return require;
  } catch {}

  const issuer = new Error().stack
    ?.split('\n')[2]
    .match(/\s*at .+? \((.*)\)$/)?.[1];
  console.log('issuer: ', issuer);
  if (issuer && path.isAbsolute(issuer)) {
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    return module.createRequire(issuer);
  } else {
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    return module.createRequire(process.cwd());
  }
};

export const resolveModule = (id: string[] | string): string | null => {
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
      if (e.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
        const expr = id.replace(/.+\/node_modules\//, '');
        const pkgName = expr.startsWith('@')
          ? expr.split('/').slice(0, 2).join('/')
          : expr.split('/')[0];
        const resolvedMain = resolveModule([resolved, pkgName]);
        assert(resolvedMain);
        const resolveDir = `${resolvedMain.slice(
          0,
          resolvedMain.lastIndexOf(`/node_modules/${pkgName}`) + 1,
        )}/node_modules/${pkgName}`;
        const subpath = expr.replace(pkgName, '.');
        return resolveModule(path.resolve(resolveDir, subpath));
      }
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
  if (!resolved) {
    throw new Error(`Can't resolve package ${id}.`);
  }
  const _require = getRequire();
  return _require(resolved);
};
