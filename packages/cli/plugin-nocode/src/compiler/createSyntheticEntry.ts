import * as path from 'path';
import { fs, HIDE_MODERN_JS_DIR } from '@modern-js/utils';
import { loadTemplate } from '../utils';
import getStyleFiles from './getStyleFiles';

export default async (rootDir: string, editorEntry: string) => {
  const entryPath = path.resolve(
    rootDir,
    `${HIDE_MODERN_JS_DIR}/umd-entry/index.js`,
  );

  const styleFiles = getStyleFiles(rootDir, entryPath);
  const entryTemplate = await loadTemplate('umd-entry.tmpl');
  const entryContent = entryTemplate({
    base: path.relative(path.dirname(entryPath), path.resolve(rootDir, 'src')),
    editor: editorEntry,
    styleFiles,
  });
  await fs.outputFile(entryPath, entryContent);
  return entryPath;
};
