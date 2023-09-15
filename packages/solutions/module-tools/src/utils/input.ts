import path from 'path';
import { fs, globby, isArray, slash } from '@modern-js/utils';
import { Input } from '../types';

export const getDefaultIndexEntry = async ({
  isTsProject,
  appDirectory,
}: {
  isTsProject: boolean;
  appDirectory: string;
}) => {
  let entry = isTsProject ? 'src/index.ts' : 'src/index.js';
  if (fs.existsSync(path.resolve(appDirectory, entry))) {
    return [entry];
  }

  entry = isTsProject ? 'src/index.tsx' : 'src/index.jsx';
  if (fs.existsSync(path.resolve(appDirectory, entry))) {
    return [entry];
  }

  return [];
};

export const normalizeInput = async (
  input: Input,
  appDirectory: string,
  enableSvgr: boolean,
) => {
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

  if (enableSvgr) {
    extensions.push('svg');
  }

  if (isArray(input)) {
    if (input.length === 0) {
      return input;
    }
    const normalizedInput = await globby(input.map(slash), {
      expandDirectories: {
        extensions,
      },
      ignore: ['**/*.d.ts'],
      cwd: appDirectory,
    });
    if (normalizedInput.length === 0) {
      throw new Error(`Can not find ${input}`);
    }
    return normalizedInput;
  } else {
    return input;
  }
};
