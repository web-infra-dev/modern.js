import fs from 'fs-extra';

export const emptyDir = async (dir: string) => {
  if (await fs.pathExists(dir)) {
    await fs.emptyDir(dir);
  }
};
