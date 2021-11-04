import path from 'path';
import { fs } from '@modern-js/generator-utils';

export function isEmptySource(appDir: string, entriesDir: string) {
  let files;
  try {
    files = fs.readdirSync(path.join(appDir, entriesDir));
  } catch (error) {
    // read error, meaning that file may not exist.
    return true;
  }

  const existValidFile = files
    .filter(
      file =>
        !/^\.[\w]+/.test(file) &&
        !/\.[\w]+(\.js|\.jsx|\.ts|\.tsx|\.json|\.d.ts)$/.test(file),
    )
    .some(file => {
      const stat = fs.statSync(path.join(appDir, entriesDir, file));
      if (stat.isDirectory()) {
        return true;
      }
      if (/(\.js|\.jsx|\.ts|\.tsx)$/.test(file)) {
        return true;
      }
      return false;
    });
  return !existValidFile;
}

export function isSingleEntry(appDir: string, entriesDir: string) {
  const hasMainEntryFile = [
    'index.jsx',
    'index.tsx',
    'App.jsx',
    'App.tsx',
  ].some(f => fs.existsSync(path.join(appDir, entriesDir, f)));
  if (!hasMainEntryFile) {
    const dirs = fs.readdirSync(path.join(appDir, entriesDir));
    if (dirs.includes('pages')) {
      return true;
    }
    return false;
  }
  return hasMainEntryFile;
}
