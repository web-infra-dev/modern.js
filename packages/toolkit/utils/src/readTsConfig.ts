import path from 'path';
import { fs, json5 } from './compiled';

export const readTsConfig = (root: string) => {
  return readTsConfigByFile(path.resolve(root, './tsconfig.json'));
};

export const readTsConfigByFile = (filename: string) => {
  const content = fs.readFileSync(path.resolve(filename), 'utf-8');
  return json5.parse(content);
};
