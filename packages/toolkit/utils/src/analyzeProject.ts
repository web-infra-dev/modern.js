import * as path from 'path';
import { getArgv } from './commands';
import { fs, minimist } from './compiled';

export const isApiOnly = async (
  appDirectory: string,
  entryDir?: string,
): Promise<boolean> => {
  const srcDir = path.join(appDirectory, entryDir ?? 'src');
  const existSrc = await fs.pathExists(srcDir);
  const options = minimist(getArgv());
  return !existSrc || Boolean(options['api-only']);
};

export const isWebOnly = async () => {
  const options = minimist(getArgv());
  return Boolean(options['web-only']);
};
