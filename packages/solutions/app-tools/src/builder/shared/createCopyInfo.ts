import path from 'path';
import { AppNormalizedConfig, IAppContext } from '../../types';

export function createCopyInfo(
  appContext: IAppContext,
  config: AppNormalizedConfig<'shared'>,
) {
  const configDir = path.resolve(
    appContext.appDirectory,
    config.source.configDir || './config',
  );
  const uploadDir = path.posix.join(configDir.replace(/\\/g, '/'), 'upload');
  const publicDir = path.posix.join(configDir.replace(/\\/g, '/'), 'public');

  return {
    configDir,
    uploadDir,
    publicDir,
  };
}
