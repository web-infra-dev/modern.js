import path from 'path';
import { createMatchPath } from 'tsconfig-paths';
import { resolvePath } from 'babel-plugin-module-resolver';
import { PluginOptions } from '@babel/core';
import { getUserAlias } from '@modern-js/utils';
import { AliasOption } from '../types';

const defaultPaths = { '@': ['./src'] };

export const aliasPlugin = (alias: AliasOption): [string, PluginOptions] => {
  const { absoluteBaseUrl, isTsPath, isTsProject = false } = alias;

  const mergedPaths = isTsPath
    ? alias.paths || {}
    : { ...defaultPaths, ...(alias.paths || {}) };
  let tsPaths: Record<string, string | string[]> = {};

  if (isTsProject) {
    tsPaths = getUserAlias(mergedPaths);
  }

  const resolvePathFn = (
    sourcePath: string,
    currentFile: string,
    opts: any,
  ) => {
    /**
     *以下是匹配到tsconfig的paths的情况进行进一步匹配和转换
     */
    const matchPath = createMatchPath(
      absoluteBaseUrl,
      tsPaths as Record<string, string[]>,
      ['index'],
    );

    const result = matchPath(sourcePath, undefined, undefined, [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
    ]);

    if (result) {
      const relativePath = path.relative(
        path.dirname(currentFile),
        path.dirname(result),
      );
      const fileName = path.basename(result);
      // 如果是同级文件，则返回的是 ''
      const filePath = path
        .normalize(
          `${relativePath.length === 0 ? '.' : relativePath}/${fileName}`,
        )
        .replace(/\\/, '/');
      return filePath.startsWith('.') ? filePath : `./${filePath}`;
    }
    return resolvePath(sourcePath, currentFile, opts);
  };
  const typescriptExts = ['.ts', '.tsx', '.js', '.jsx', '.es', '.es6', '.mjs'];
  return [
    'babel-plugin-module-resolver',
    {
      root: absoluteBaseUrl,
      alias: mergedPaths,
      resolvePath: isTsPath ? resolvePathFn : undefined,
      extensions: isTsProject ? typescriptExts : undefined,
    },
  ];
};
