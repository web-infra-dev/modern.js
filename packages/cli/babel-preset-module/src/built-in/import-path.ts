import path from 'path';
import { types as t } from '@babel/core';
import type { NodePath, PluginPass } from '@babel/core';
import type { ImportStyleType } from '../types';
import { isProjectFile } from './utils';

export interface IImportPathOpts {
  appDirectory: string;
  importStyle?: ImportStyleType;
}

const replaceValueHash: Record<string, string> = {};

const isResoureInSrc = (srcDir: string, resourecPath: string) =>
  !path.posix.relative(srcDir, resourecPath).includes('..');

const getImportFileDistPath = (
  compilerFile: string,
  srcDir: string,
  importName: string,
) => {
  const dir = path.posix.dirname(compilerFile);
  const compilerFileRelativeLoc = path.posix.relative(dir, srcDir);
  const importFileRelativeLoc = path.posix.relative(
    srcDir,
    path.posix.join(dir, importName),
  );
  const inSrc = isResoureInSrc(srcDir, path.posix.join(dir, importName));
  const importFileDistPath = path.posix.join(
    inSrc ? '..' : '../..',
    compilerFileRelativeLoc,
    'styles',
    importFileRelativeLoc,
  );

  return importFileDistPath;
};

const isStaticFile = (file: string) => {
  const tests = [/\.js$/, /\.jsx$/, /\.ts$/, /\.tsx$/];
  return !(tests.some(regex => regex.test(file)) || path.extname(file) === '');
};

const isStyleFile = (file: string) => {
  const tests = [/\.css$/, /\.less$/, /\.sass$/, /\.scss$/];

  return tests.some(regex => regex.test(file));
};

const getReplacePath = (
  importName: string | undefined,
  filename: string | null | undefined,
  srcDir: string,
  importStyle: string,
) => {
  if (!filename || !importName) {
    return '';
  }

  if (!isProjectFile(importName)) {
    return '';
  }

  if (!isStaticFile(importName)) {
    return '';
  }

  let realFilepath = getImportFileDistPath(filename, srcDir, importName);
  if (isStyleFile(realFilepath) && importStyle === 'compiled-code') {
    realFilepath = realFilepath.replace(/\.(less|sass|scss)$/, '.css');
  }

  return realFilepath;
};

const importPath = () => ({
  name: 'import-path',
  visitor: {
    Program(nodePath: NodePath<t.Program>, { opts, file }: PluginPass) {
      nodePath.traverse({
        ImportDeclaration({ node }) {
          const { source } = node;
          const { appDirectory, importStyle = 'source-code' } =
            opts as IImportPathOpts;
          const srcDir = `${appDirectory}/src`;
          const {
            opts: { filename },
          } = file;

          const importName = source?.value ? source.value : undefined;
          const replaceValue = getReplacePath(
            importName,
            filename,
            srcDir,
            importStyle,
          );
          const hashKey = filename + (importName || '');
          if (replaceValue) {
            if (typeof filename === 'string' && !replaceValueHash[hashKey]) {
              node.source.value = replaceValue;
              replaceValueHash[hashKey] = replaceValue;
            } else if (
              typeof filename === 'string' &&
              replaceValueHash[hashKey]
            ) {
              node.source.value = replaceValueHash[hashKey];
            } else {
              node.source.value = replaceValue;
            }
          }
        },
        // dynamic import
        CallExpression({ node }) {
          const { appDirectory, importStyle = 'source-code' } =
            opts as IImportPathOpts;
          const srcDir = `${appDirectory}/src`;
          const { filename } = file.opts;
          const { callee, arguments: args } = node;

          if (
            callee.type === 'Import' ||
            (callee.type === 'Identifier' && callee.name === 'require')
          ) {
            const firstArg = args[0] as t.StringLiteral;
            if (firstArg.value) {
              const importName = firstArg.value;
              const replaceValue = getReplacePath(
                importName,
                filename,
                srcDir,
                importStyle,
              );
              const hashKey = filename + (importName || '');
              if (replaceValue) {
                if (
                  typeof filename === 'string' &&
                  !replaceValueHash[hashKey]
                ) {
                  node.arguments = [t.stringLiteral(replaceValue)];
                  replaceValueHash[hashKey] = replaceValue;
                } else if (
                  typeof filename === 'string' &&
                  replaceValueHash[hashKey]
                ) {
                  node.arguments = [t.stringLiteral(replaceValueHash[hashKey])];
                } else {
                  node.arguments = [t.stringLiteral(replaceValue)];
                }
              }
            }
          }
        },
      });
    },
  },
});

export default importPath;
