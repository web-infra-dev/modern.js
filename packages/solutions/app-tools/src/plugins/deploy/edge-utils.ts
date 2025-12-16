import path from 'path';
import { SERVER_DIR, fs as fse } from '@modern-js/utils';
import type { AppToolsContext } from '../../types/plugin';

export const isTextFile = (filePath: string) => {
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

export const normalizePath = (filePath: string) => filePath.replace(/\\/g, '/');

export const copyFileForEdge = async (
  sourcePath: string,
  targetPath: string,
) => {
  await fse.ensureDir(path.dirname(targetPath));
  const ext = path.extname(sourcePath);
  // console.log(`Copying ${ext} file: ${sourcePath} -> ${targetPath}`);

  // If it's a JS-like file, copy as is
  if (['.js', '.mjs', '.json'].includes(ext)) {
    return fse.copyFile(sourcePath, targetPath);
  }

  if (!isTextFile(sourcePath)) {
    return false;
  }

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

  return fse.writeFile(jsTargetPath, jsContent);
};

export const serverAppContenxtTemplate = (appContext: AppToolsContext) => {
  const {
    appDirectory,
    sharedDirectory,
    apiDirectory,
    lambdaDirectory,
    metaName,
    bffRuntimeFramework,
  } = appContext;
  return {
    sharedDirectory: `"${normalizePath(
      path.relative(appDirectory, sharedDirectory),
    )}"`,
    apiDirectory: `"${normalizePath(path.relative(appDirectory, apiDirectory))}"`,
    lambdaDirectory: `"${normalizePath(
      path.relative(appDirectory, lambdaDirectory),
    )}"`,
    metaName,
    bffRuntimeFramework: bffRuntimeFramework || 'hono',
  };
};

export const getServerConfigPath = (meta: string) =>
  `"${normalizePath(path.join(SERVER_DIR, `${meta}.server`))}"`;
