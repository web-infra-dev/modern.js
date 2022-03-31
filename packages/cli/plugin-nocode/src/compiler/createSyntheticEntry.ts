import * as path from 'path';
import { fs, normalizeOutputPath } from '@modern-js/utils';
import slash from 'slash';
import { loadTemplate } from '../utils';
import getStyleFiles from './getStyleFiles';

export default async (
  rootDir: string,
  internalDirectory: string,
  editorEntry: string,
) => {
  const entryPath = path.resolve(internalDirectory, `umd-entry/index.js`);

  const styleFiles = getStyleFiles(rootDir, entryPath);
  const entryTemplate = await loadTemplate('umd-entry.tmpl');
  const entryContent = entryTemplate({
    base: slash(
      path.relative(path.dirname(entryPath), path.resolve(rootDir, 'src')),
    ),
    editor: normalizeOutputPath(editorEntry),
    styleFiles,
  });
  await fs.outputFile(entryPath, entryContent);
  return entryPath;
};
