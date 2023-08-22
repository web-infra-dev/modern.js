import path from 'path';
import { fs, globby, isArray } from '@modern-js/utils';
import { Input } from '../types';

export const getDefaultIndexEntry = async ({
  isTsProject,
  appDirectory,
}: {
  isTsProject: boolean;
  appDirectory: string;
}) => {
  let entry = isTsProject
    ? path.resolve(appDirectory, 'src/index.ts')
    : path.resolve(appDirectory, 'src/index.js');
  if (fs.existsSync(entry)) {
    return [path.relative(appDirectory, entry)];
  }

  entry = isTsProject
    ? path.resolve(appDirectory, 'src/index.tsx')
    : path.resolve(appDirectory, 'src/index.jsx');
  if (fs.existsSync(entry)) {
    return [path.relative(appDirectory, entry)];
  }

  return [];
};

export const normalizeInput = async (input: Input, appDirectory: string) => {
  const extensions = [
    'js',
    'ts',
    'jsx',
    'tsx',
    'mjs',
    'cjs',
    'mts',
    'cts',
    'css',
    'sass',
    'scss',
    'less',
    'json',
  ];

  if (isArray(input)) {
    const normalizedInput = await globby(input, {
      expandDirectories: {
        extensions,
      },
      ignore: ['**/*.d.ts'],
      cwd: appDirectory,
    });
    return normalizedInput;
  } else {
    return input;
  }
};
