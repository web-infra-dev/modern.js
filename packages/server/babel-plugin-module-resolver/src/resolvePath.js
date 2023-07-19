import path from 'path';

import { warn } from './log';
import mapToRelative from './mapToRelative';
import normalizeOptions from './normalizeOptions';
import {
  nodeResolvePath,
  replaceExtension,
  isRelativePath,
  toLocalPath,
  toPosixPath,
} from './utils';

function getRelativePath(sourcePath, currentFile, absFileInRoot, opts) {
  const realSourceFileExtension = path.extname(absFileInRoot);
  const sourceFileExtension = path.extname(sourcePath);

  let relativePath = mapToRelative(opts.cwd, currentFile, absFileInRoot);
  if (realSourceFileExtension !== sourceFileExtension) {
    relativePath = replaceExtension(relativePath, opts);
  }

  return toLocalPath(toPosixPath(relativePath));
}

function findPathInRoots(sourcePath, { extensions, root }) {
  // Search the source path inside every custom root directory
  let resolvedSourceFile;

  root.some(basedir => {
    resolvedSourceFile = nodeResolvePath(
      `./${sourcePath}`,
      basedir,
      extensions,
    );
    return resolvedSourceFile !== null;
  });

  return resolvedSourceFile;
}

function resolvePathFromRootConfig(sourcePath, currentFile, opts) {
  const absFileInRoot = findPathInRoots(sourcePath, opts);

  if (!absFileInRoot) {
    return null;
  }

  return getRelativePath(sourcePath, currentFile, absFileInRoot, opts);
}

function checkIfPackageExists(modulePath, currentFile, extensions, loglevel) {
  const resolvedPath = nodeResolvePath(modulePath, currentFile, extensions);
  if (resolvedPath === null && loglevel !== 'silent') {
    warn(`Could not resolve "${modulePath}" in file ${currentFile}.`);
  }
}

function resolvePathFromAliasConfig(sourcePath, currentFile, opts) {
  let aliasedSourceFile;

  opts.alias.find(([regExp, substitute]) => {
    const execResult = regExp.exec(sourcePath);

    if (execResult === null) {
      return false;
    }

    aliasedSourceFile = substitute(execResult);
    return true;
  });

  if (!aliasedSourceFile) {
    return null;
  }

  // Alias with array of paths
  if (Array.isArray(aliasedSourceFile)) {
    return aliasedSourceFile
      .map(asf => {
        if (isRelativePath(asf)) {
          return toLocalPath(
            toPosixPath(mapToRelative(opts.cwd, currentFile, asf)),
          );
        }
        return asf;
      })
      .find(src =>
        nodeResolvePath(src, path.dirname(currentFile), opts.extensions),
      );
  }

  if (isRelativePath(aliasedSourceFile)) {
    return toLocalPath(
      toPosixPath(mapToRelative(opts.cwd, currentFile, aliasedSourceFile)),
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    checkIfPackageExists(
      aliasedSourceFile,
      currentFile,
      opts.extensions,
      opts.loglevel,
    );
  }

  return aliasedSourceFile;
}

const resolvers = [resolvePathFromAliasConfig, resolvePathFromRootConfig];

export default function resolvePath(sourcePath, currentFile, opts) {
  if (isRelativePath(sourcePath)) {
    return sourcePath;
  }

  const normalizedOpts = normalizeOptions(currentFile, opts);

  // File param is a relative path from the environment current working directory
  // (not from cwd param)
  const absoluteCurrentFile = path.resolve(currentFile);
  let resolvedPath = null;

  resolvers.some(resolver => {
    resolvedPath = resolver(sourcePath, absoluteCurrentFile, normalizedOpts);
    return resolvedPath !== null;
  });

  return resolvedPath;
}
