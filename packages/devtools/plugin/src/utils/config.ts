import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import { DevtoolsConfig } from '@modern-js/devtools-kit';

const CONFIG_FILENAME = 'modern.runtime.json';

export function getConfigFilenames(dir = process.cwd()) {
  const files: string[] = [];
  let curr = dir;
  while (path.dirname(curr) !== curr) {
    files.push(path.join(curr, CONFIG_FILENAME));
    // files.push(path.join(curr, 'node_modules/.modern-js', CONFIG_FILENAME));
    curr = path.dirname(curr);
  }
  return files;
}

/** Resolve all config files from target directory upward to the root path. */
export async function resolveConfigFiles(
  dir = process.cwd(),
): Promise<string[]> {
  const files = getConfigFilenames(dir);
  const ret: string[] = [];
  await Promise.all(
    files.map(async file => (await fs.pathExists(file)) && ret.push(file)),
  );
  return ret;
}

export async function loadConfigFile(filename: string) {
  const { storagePresets }: DevtoolsConfig = await fs.readJSON(filename);
  if (storagePresets) {
    for (const preset of storagePresets) {
      preset.filename = filename;
    }
  }
  return { storagePresets };
}

export async function loadConfigFiles(dir = process.cwd()) {
  const filenames = await resolveConfigFiles(dir);
  const ret = await Promise.all(filenames.map(loadConfigFile));
  return ret;
}
