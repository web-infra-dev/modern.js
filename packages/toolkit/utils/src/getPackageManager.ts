import os from 'os';
import path from 'path';
import { fs } from './compiled';
import { canUsePnpm, canUseYarn } from './nodeEnv';

const MAX_TIMES = 5;
export async function getPackageManager(cwd: string = process.cwd()) {
  let appDirectory = cwd;
  let times = 0;
  while (os.homedir() !== appDirectory && times < MAX_TIMES) {
    times++;
    if (fs.existsSync(path.resolve(appDirectory, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.resolve(appDirectory, 'yarn.lock'))) {
      return 'yarn';
    }
    if (fs.existsSync(path.resolve(appDirectory, 'package-lock.json'))) {
      return 'npm';
    }
    appDirectory = path.join(appDirectory, '..');
  }
  if (await canUsePnpm()) {
    return 'pnpm';
  }
  if (await canUseYarn()) {
    return 'yarn';
  }
  return 'npm';
}
