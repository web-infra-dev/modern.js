import path from 'node:path';
import type { Entrypoint } from '@modern-js/plugin';
import { fs as fse } from '@modern-js/utils';
import type { AppToolsNormalizedConfig } from '../../../types';
import { isMainEntry } from '../../../utils/routes';
import { normalizePath } from '../utils';

const isTextFile = (filePath: string) => {
  const textExtensions = ['.txt', '.html', '.css', '.svg', '.css'];

  const ext = path.extname(filePath).toLowerCase();
  return textExtensions.includes(ext);
};

export const walkDirectory = async (
  sourceDir: string,
  cb: (filePath: string) => void | Promise<void>,
) => {
  // Read directory contents
  const items = await fse.readdir(sourceDir);

  for (const item of items) {
    const sourcePath = path.join(sourceDir, item);

    const stat = await fse.stat(sourcePath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      await walkDirectory(sourcePath, cb);
    } else if (stat.isFile()) {
      // Process files based on extension
      await cb(sourcePath);
    }
  }
};

const copyStaticDepFiles = async (sourcePath: string, targetPath: string) => {
  const ext = path.extname(sourcePath);

  // If it's a JS-like file, do not copy
  if (['.js', '.mjs', '.json'].includes(ext)) {
    return { path: sourcePath };
  }

  if (!isTextFile(sourcePath)) {
    return;
  }

  await fse.ensureDir(path.dirname(targetPath));
  // Handle text files
  const content = await fse.readFile(sourcePath, 'utf-8');
  // Escape quotes and backslashes in content
  const escapedContent = content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  const jsContent = `\
// Automatically generated JS wrapper for ${path.basename(sourcePath)}
export const _DEP_TEXT = \`${escapedContent}\`;
`;

  // Keep the same filename but with .js extension
  const jsTargetPath = `${targetPath}.js`;

  await fse.writeFile(jsTargetPath, jsContent);
  return { path: jsTargetPath, wrapper: '_DEP_TEXT' };
};

export const scanDeps = async (
  source: string,
  tempDirectory: string,
  skipPrefix: string[] = [],
) => {
  const t = path.join(tempDirectory, 'modern-server-bundle/deps');
  await fse.ensureDir(t);
  const codes = ['{'];
  await walkDirectory(source, async filePath => {
    // skip static files
    if (skipPrefix.some(x => filePath.startsWith(x))) {
      return;
    }

    // Skip map and LICENSE files, they will increase server bundle size
    if (filePath.endsWith('.map') || filePath.endsWith('.LICENSE.txt')) {
      return;
    }

    const relative = normalizePath(path.relative(source, filePath));
    const targetPath = path.join(t, relative);
    const copyResult = await copyStaticDepFiles(filePath, targetPath);
    if (copyResult) {
      const suffix = copyResult.wrapper
        ? `.then(x => x.${copyResult.wrapper})`
        : '';
      codes.push(
        `${JSON.stringify(relative)}: () => import(${JSON.stringify(copyResult.path)})${suffix},`,
      );
    }
  });
  codes.push('}');

  return {
    code: codes.join('\n'),
  };
};

export const copyEntriesHtml = async (
  modernConfig: AppToolsNormalizedConfig,
  entrypoints: Entrypoint[],
  from: string,
  to: string,
) => {
  const {
    source: { mainEntryName },
  } = modernConfig;
  for (const entry of entrypoints) {
    const isMain = isMainEntry(entry.entryName, mainEntryName);
    const entryFilePath = path.join(
      from,
      'html',
      entry.entryName,
      'index.html',
    );
    const targetHtml = isMain ? 'index.html' : `${entry.entryName}.html`;
    await fse.copyFile(entryFilePath, path.join(to, targetHtml));
  }
};
