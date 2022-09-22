import { join } from 'path';
import type {
  BuilderConfig,
  DistPathConfig,
  FilenameConfig,
  FinalConfig,
} from '../types';

export async function isFileExists(file: string) {
  const { promises, constants } = await import('fs');
  return promises
    .access(file, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export const getCompiledPath = (packageName: string) =>
  join(__dirname, '../../compiled', packageName);

export const getDistPath = (
  config: FinalConfig,
  type: keyof DistPathConfig,
): string => {
  const { distPath } = config.output;
  const ret = distPath[type];
  if (!ret) {
    throw new Error(`unknown key ${type} in "output.distPath"`);
  }
  return ret;
};

export const getFilename = (
  config: BuilderConfig,
  type: keyof FilenameConfig,
  isProd: boolean,
) => {
  const { filename = {} } = config.output || {};
  const useHash = isProd && !config.output?.disableFilenameHash;
  const hash = useHash ? '.[contenthash:8]' : '';

  switch (type) {
    case 'js':
      return filename.js ?? `[name]${hash}.js`;
    case 'css':
      return filename.css ?? `[name]${hash}.css`;
    case 'svg':
      return filename.svg ?? `[name]${hash}.svg`;
    case 'font':
      return filename.font ?? `[name]${hash}[ext]`;
    case 'image':
      return filename.image ?? `[name]${hash}[ext]`;
    case 'media':
      return filename.media ?? `[name]${hash}[ext]`;
    default:
      throw new Error(`unknown key ${type} in "output.filename"`);
  }
};
