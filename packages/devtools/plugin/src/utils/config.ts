import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import { StoragePresetContext } from '@modern-js/devtools-kit';

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

export async function loadConfigFile(filename: string) {
  const raw = await fs.readJSON(filename);
  const ret: StoragePresetContext = { ...raw, filename };
  return ret;
}

export async function loadConfigFiles(dir = process.cwd()) {
  const filenames = await resolveConfigFiles(dir);
  const ret = await Promise.all(filenames.map(loadConfigFile));
  return ret;
}
