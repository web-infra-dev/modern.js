import path from 'path';
import resolve from 'resolve';

export function nodeResolvePath(modulePath, basedir, extensions) {
  try {
    return resolve.sync(modulePath, { basedir, extensions });
  } catch (e) {
    return null;
  }
}

export function isRelativePath(nodePath) {
  return nodePath.match(/^\.?\.\//);
}

export function toPosixPath(modulePath) {
  return modulePath.replace(/\\/g, '/');
}

export function toLocalPath(modulePath) {
  let localPath = modulePath.replace(/\/index$/, ''); // remove trailing /index
  if (!isRelativePath(localPath)) {
    localPath = `./${localPath}`; // insert `./` to make it a relative path
  }
  return localPath;
}

export function stripExtension(modulePath, stripExtensions) {
  let name = path.basename(modulePath);
  stripExtensions.some(extension => {
    if (name.endsWith(extension)) {
      name = name.slice(0, name.length - extension.length);
      return true;
    }
    return false;
  });
  return name;
}

export function replaceExtension(modulePath, opts) {
  const filename = stripExtension(modulePath, opts.stripExtensions);
  return path.join(path.dirname(modulePath), filename);
}

export function matchesPattern(types, calleePath, pattern) {
  const { node } = calleePath;

  if (types.isMemberExpression(node)) {
    return calleePath.matchesPattern(pattern);
  }

  if (!types.isIdentifier(node) || pattern.includes('.')) {
    return false;
  }

  const name = pattern.split('.')[0];

  return node.name === name;
}

export function isImportCall(types, calleePath) {
  return types.isImport(calleePath.node.callee);
}

export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
