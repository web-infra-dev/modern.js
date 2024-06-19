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

/**
 * Transform the metaName
 * @param metaName The name of framework, the default value is 'modern-js'
 * @returns
 * modern-js -> modern
 */
export const getMeta = (metaName = 'modern-js') => {
  const meta = metaName.toLowerCase().split('-')[0];

  return meta;
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
