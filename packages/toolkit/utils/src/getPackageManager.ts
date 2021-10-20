import os from 'os';
import fs from 'fs-extra';
import * as path from './path';

export function getPackageManager(cwd: string = process.cwd()) {
  let appDirectory = cwd;
  while (os.homedir() !== appDirectory) {
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
  return 'npm';
}
