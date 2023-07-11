import path from 'path';
import { fs, json5 } from '@modern-js/utils';
import { PACKAGE_JSON, RUSH_JSON_FILE } from './constants';
import type { INodePackageJson, IRushConfig } from './types';

export const readPackageJson = async (pkgJsonFilePath: string) => {
  const packageJson = readJson<INodePackageJson>(
    pkgJsonFilePath.includes(PACKAGE_JSON)
      ? pkgJsonFilePath
      : path.join(pkgJsonFilePath, PACKAGE_JSON),
  );
  return packageJson;
};

export const readRushJson = async (rushJsonFilePath: string) => {
  const rushJson = readJson<IRushConfig>(
    rushJsonFilePath.includes(RUSH_JSON_FILE)
      ? rushJsonFilePath
      : path.join(rushJsonFilePath, RUSH_JSON_FILE),
  );
  return rushJson;
};

export const readJson = async <T>(jsonFileAbsPath: string) => {
  const content = await fs.readFile(jsonFileAbsPath, 'utf-8');
  const json: T = json5.parse(content);
  return json;
};
