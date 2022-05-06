import * as path from 'path';
import { fs, minimist } from './compiled';

export const isApiOnly = async (appDirectory: string): Promise<boolean> => {
  const srcDir = path.join(appDirectory, 'src');
  const existSrc = await fs.pathExists(srcDir);
  const options = minimist(process.argv.slice(2));
  return !existSrc || Boolean(options['api-only']);
};
