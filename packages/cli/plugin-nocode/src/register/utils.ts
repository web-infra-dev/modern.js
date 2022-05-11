import path from 'path';
import { fs } from '@modern-js/utils';

export const pickOneExisting = async (dir, filenames) => {
  const res = await Promise.all(
    filenames.map(file => fs.pathExists(path.resolve(dir, file))),
  );
  if (res.some(Boolean)) {
    const i = res.findIndex(Boolean);
    return path.resolve(dir, filenames[i]);
  }
  return null;
};
