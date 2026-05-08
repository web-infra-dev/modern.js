import path from 'path';
import { TS_CONFIG_FILENAME } from './constants';

export const resolveServerTsconfig = (
  appDirectory: string,
  configuredPath?: string,
): string => {
  if (configuredPath) {
    return path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(appDirectory, configuredPath);
  }
  return path.resolve(appDirectory, TS_CONFIG_FILENAME);
};
