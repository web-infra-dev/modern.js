import { fs } from '../compiled';

/**
 * Find first already exists file.
 * @param files - Absolute file paths with extension.
 * @returns The file path if exists, or false if no file exists.
 */
export const findExists = (files: string[]): string | false => {
  for (const file of files) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return file;
    }
  }
  return false;
};

export const emptyDir = async (dir: string) => {
  if (await fs.pathExists(dir)) {
    await fs.emptyDir(dir);
  }
};
