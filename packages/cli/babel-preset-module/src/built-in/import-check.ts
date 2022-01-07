import path from 'path';
import { NodePath, PluginPass, types as t } from '@babel/core';
import { isProjectFile } from './utils';

export interface IImportCheckOpts {
  appDirectory: string;
}

const isStylesDirFile = (
  appDirectory: string,
  currentFilePath: string | null | undefined,
  importPath: string,
) => {
  if (!currentFilePath) {
    return false;
  }

  const importFileAbsPath = path.join(
    path.dirname(currentFilePath),
    importPath,
  );
  const stylesAbsPath = path.resolve(appDirectory, 'styles');
  return importFileAbsPath.includes(stylesAbsPath);
};

const checkIsOutsideSrc = (
  filename: string | null | undefined,
  importName: string,
  srcDir: string,
) => {
  if (!filename || filename.includes('node_modules/.block-tools/source')) {
    return false;
  }
  const currentFileDir = path.dirname(filename);
  const importFileAbsPath = path.resolve(currentFileDir, importName);
  return path.relative(srcDir, importFileAbsPath).includes('..');
};

export const importCheck = () => ({
  name: 'import-check',
  visitor: {
    Program(nodePath: NodePath<t.Program>, { opts, file }: PluginPass) {
      nodePath.traverse({
        ImportDeclaration(innerPath) {
          const { source } = innerPath.node;
          const { appDirectory } = opts as IImportCheckOpts;
          const { filename } = file.opts;
          const srcDir = `${appDirectory}/src`;
          const importName = source?.value ? source.value : undefined;
          if (typeof importName !== 'string') {
            innerPath.skip();
          }

          if (!isProjectFile(importName as string)) {
            innerPath.skip();
          }

          if (isStylesDirFile(appDirectory, filename, importName as string)) {
            throw new Error(
              `Importing files in 'styles' directory is not allowed: '${
                importName as string
              }', You can place the file in the 'src' directory or remove the imported code`,
            );
          }
          if (checkIsOutsideSrc(filename, importName as string, srcDir)) {
            throw new Error(
              `Importing files outside of 'src' directory is not allowed: '${
                importName as string
              }, You can place the file in the 'src' directory and modify the imported code'`,
            );
          }
        },
      });
    },
  },
});

export default importCheck;
