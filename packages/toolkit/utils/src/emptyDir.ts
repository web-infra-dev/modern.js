import { fs } from './compiled';

export const emptyDir = async (dir: string) => {
  if (await fs.pathExists(dir)) {
    await fs.emptyDir(dir);
  }
};
