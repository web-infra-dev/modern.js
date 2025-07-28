import path from 'path';
import type { AppToolsContext } from '../types/plugin';

export async function generateWatchFiles(
  appContext: AppToolsContext,
  configDir?: string,
): Promise<string[]> {
  const { appDirectory, configFile } = appContext;
  const configPath = path.join(appDirectory, configDir || '');

  return [`${configPath}/html`, configFile || './config'];
}
