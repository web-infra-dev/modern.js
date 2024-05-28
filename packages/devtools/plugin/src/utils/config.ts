import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import {
  DevtoolsConfig,
  DevtoolsContext,
  StoragePresetWithIdent,
  StoragePresetContext,
  StoragePresetConfig,
} from '@modern-js/devtools-kit';
import { logger, nanoid } from '@modern-js/utils';

export function getConfigFilenames(base: string, dir = process.cwd()) {
  const files: string[] = [];
  let curr = dir;
  while (path.dirname(curr) !== curr) {
    files.push(path.join(curr, base));
    // files.push(path.join(curr, 'node_modules/.modern-js', base));
    curr = path.dirname(curr);
  }
  return files;
}

/** Resolve all config files from target directory upward to the root path. */
export async function resolveConfigFiles(
  base: string,
  dir = process.cwd(),
): Promise<string[]> {
  const files = getConfigFilenames(base, dir);
  const ret: string[] = [];
  await Promise.all(
    files.map(async file => (await fs.pathExists(file)) && ret.push(file)),
  );
  return ret;
}

export async function loadConfigFile(filename: string) {
  const storagePresets: StoragePresetConfig[] = [];
  try {
    const config: DevtoolsConfig = await fs.readJSON(filename);
    config.storagePresets && storagePresets.push(...config.storagePresets);
  } catch (e) {
    logger.error(e);
    return null;
  }
  type PresetWithIdent = StoragePresetWithIdent & { id: string };
  const presets: PresetWithIdent[] = [];
  let _validated = true;
  for (const preset of storagePresets) {
    if (typeof preset.id !== 'string') {
      preset.id = nanoid();
      _validated = false;
    }
    presets.push(preset as PresetWithIdent);
  }
  if (!_validated) {
    await fs.outputJSON(filename, { storagePresets: presets }, { spaces: 2 });
    return null;
  }
  const ret: StoragePresetContext[] = [];
  for (const preset of presets) {
    ret.push({ ...preset, filename });
  }
  return { storagePresets: ret };
}

export async function loadConfigFiles(base: string, dir = process.cwd()) {
  const filenames = await resolveConfigFiles(base, dir);
  const resolved = await Promise.all(filenames.map(loadConfigFile));
  const ret: Partial<DevtoolsContext>[] = [];
  for (const config of resolved) {
    if (config) {
      ret.push(config);
    } else {
      return null;
    }
  }
  return ret;
}
