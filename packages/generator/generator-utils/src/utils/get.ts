import path from 'path';
import { fs } from '@modern-js/codesmith-utils/fs-extra';
import json5 from 'json5';

export const readTsConfig = (root: string) => {
  return readTsConfigByFile(path.resolve(root, './tsconfig.json'));
};

export const readTsConfigByFile = (filename: string) => {
  const content = fs.readFileSync(path.resolve(filename), 'utf-8');
  return json5.parse(content);
};
