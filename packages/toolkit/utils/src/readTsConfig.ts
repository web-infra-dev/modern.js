import path from 'path';

export const readTsConfig = (root: string) => {
  // import typescript from 'typescript' cause eslint fromat error.
  const typescript = require('typescript');

  return typescript.readConfigFile(
    path.resolve(root, './tsconfig.json'),
    typescript.sys.readFile,
  ).config;
};

export const readTsConfigByFile = (filename: string) => {
  // import typescript from 'typescript' cause eslint fromat error.
  const typescript = require('typescript');

  return typescript.readConfigFile(
    path.resolve(filename),
    typescript.sys.readFile,
  ).config;
};
