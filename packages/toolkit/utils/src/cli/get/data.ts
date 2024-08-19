import os from 'os';
import path from 'path';
import type { InternalPlugins } from '@modern-js/types';
import { browserslist, fs, json5 } from '../../compiled';
import { INTERNAL_CLI_PLUGINS } from '../constants';
import { isDepExists } from '../is';
import { canUsePnpm, canUseYarn } from '../package';

// get data from file
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

export const getCoreJsVersion = (corejsPkgPath: string) => {
  try {
    const { version } = fs.readJSONSync(corejsPkgPath);
    const [major, minor] = version.split('.');
    return `${major}.${minor}`;
  } catch (err) {
    return '3';
  }
};

export const getAntdMajorVersion = (appDirectory: string) => {
  try {
    const pkgJsonPath = require.resolve('antd/package.json', {
      paths: [appDirectory],
    });
    const { version } = require(pkgJsonPath);
    return Number(version.split('.')[0]);
  } catch (err) {
    return null;
  }
};

export const defaults = ['> 0.01%', 'not dead', 'not op_mini all'];

export const getBrowserslist = (appDirectory: string) =>
  browserslist.loadConfig({ path: appDirectory }) || defaults;

export function getInternalPlugins(
  appDirectory: string,
  internalPlugins: InternalPlugins = INTERNAL_CLI_PLUGINS,
) {
  return [
    ...Object.keys(internalPlugins)
      .filter(name => {
        const config = internalPlugins[name];
        if (typeof config !== 'string' && config.forced === true) {
          return true;
        }
        return isDepExists(appDirectory, name);
      })
      .map(name => {
        const config = internalPlugins[name];
        if (typeof config !== 'string') {
          return config.path;
        } else {
          return config;
        }
      }),
  ];
}

export const readTsConfig = (root: string) => {
  return readTsConfigByFile(path.resolve(root, './tsconfig.json'));
};

export const readTsConfigByFile = (filename: string) => {
  const content = fs.readFileSync(path.resolve(filename), 'utf-8');
  return json5.parse(content);
};
