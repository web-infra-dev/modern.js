import path from 'path';
import { fs as fse } from '@modern-js/utils';

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

export const copyFileForEdgeEnv = async (
  sourcePath: string,
  targetPath: string,
) => {
  const ext = path.extname(sourcePath);

  // If it's a JS-like file, copy as is
  if (['js', 'mjs', 'json'].includes(ext)) {
    return fse.copyFile(sourcePath, targetPath);
  }

  let jsContent;

  if (isTextFile(sourcePath)) {
    // Handle text files
    const content = await fse.readFile(sourcePath, 'utf-8');
    // Escape quotes and backslashes in content
    const escapedContent = content
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    jsContent = `\
// Automatically generated JS wrapper for ${path.basename(sourcePath)}
export const _DEP_TEXT = \`${escapedContent}\`;
`;
  } else {
    // Handle binary files
    const content = await fse.readFile(sourcePath);
    const contentAsBase64 = content.toString('base64');

    jsContent = `\
// Automatically generated JS wrapper for ${path.basename(sourcePath)}
export const _DEP_BUF = Buffer.from("${contentAsBase64}", 'base64');`;
  }

  // Keep the same filename but with .js extension
  const jsTargetPath = `${targetPath}.js`;

  await fse.writeFile(jsTargetPath, jsContent);
  // console.log(`Wrapped file: ${sourcePath} -> ${jsTargetPath}`);
};
