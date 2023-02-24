import * as path from 'path';

export const getTargetDir = (
  from: string,
  baseDir: string,
  targetBaseDir: string,
) => {
  const relativePath = path.relative(baseDir, from);
  return path.resolve(targetBaseDir, relativePath);
};
