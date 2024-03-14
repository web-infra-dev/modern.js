import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import { DevtoolsConfig } from '../types';

const CONFIG_FILENAME = 'modern.devtools.json';

async function findUp(filename: string, dir = process.cwd()) {
  const filePath = path.join(dir, filename);
  if (await fs.pathExists(filePath)) {
    return filePath;
  }
  const parent = path.dirname(dir);
  if (parent === dir) {
    return null;
  }
  return findUp(filename, parent);
}

export function resolveConfigFile(dir = process.cwd()) {
  return findUp(CONFIG_FILENAME, dir);
}

/** Resolve all config files from target directory upward to the root path. */
export async function resolveConfigFiles(
  dir = process.cwd(),
): Promise<string[]> {
  const files = [];
  let currentDir = dir;
  while (true) {
    const configFile = await resolveConfigFile(currentDir);
    if (!configFile) {
      break;
    }
    files.push(configFile);
    currentDir = path.dirname(currentDir);
  }
  return files;
}

export async function loadConfigFile(dir = process.cwd()) {
  const filename = await resolveConfigFile(dir);
  if (!filename) {
    return null;
  }
  const raw = await fs.readJson(filename);
  return raw as DevtoolsConfig;
}

export async function loadConfigFiles(dir = process.cwd()) {
  const filenames = await resolveConfigFiles(dir);
  const configs = await Promise.all(filenames.map(loadConfigFile));
  return configs.filter(Boolean) as DevtoolsConfig[];
}
