import path from 'path';
import { CONFIG_FILE_EXTENSIONS } from '../constants';
import { findExists } from '../fs';

// get filepath
export const getServerConfig = async (
  appDirectory: string,
  configFile: string,
) => {
  const configFilePath = findExists(
    CONFIG_FILE_EXTENSIONS.map(extension =>
      path.resolve(appDirectory, `${configFile}${extension}`),
    ),
  );

  return configFilePath;
};

export const getTargetDir = (
  from: string,
  baseDir: string,
  targetBaseDir: string,
) => {
  const relativePath = path.relative(baseDir, from);
  return path.resolve(targetBaseDir, relativePath);
};

export * from './data';
export * from './config';
