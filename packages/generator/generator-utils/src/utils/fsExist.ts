import { fs } from '@modern-js/codesmith-utils/fs-extra';

export async function fileExist(filePath: string) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
