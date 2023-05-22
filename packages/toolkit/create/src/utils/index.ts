import path from 'path';
import fs from '@modern-js/utils/fs-extra';

export function isEmptyDir(dirname: string) {
  try {
    const files = fs.readdirSync(dirname);
    return files.length === 0;
  } catch (e) {
    throw new Error(`read dir ${dirname} failed`);
  }
}

export function createDir(dirname: string, pwd: string) {
  const createPath = path.resolve(pwd, dirname);
  if (fs.existsSync(createPath) && !isEmptyDir(createPath)) {
    throw new Error(`directory '${dirname}' already exists`);
  }
  fs.mkdirpSync(createPath);
  return dirname;
}
