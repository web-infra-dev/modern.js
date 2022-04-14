import * as path from 'path';
import { CONFIG_FILE_EXTENSIONS } from './constants';
import { findExists } from './findExists';

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
