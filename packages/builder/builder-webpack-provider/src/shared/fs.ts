import { join } from 'path';
import type {
  DistPathConfig,
  FilenameConfig,
  NormalizedConfig,
} from '../types';

export const getCompiledPath = (packageName: string) =>
  join(__dirname, '../../compiled', packageName);

export const getDistPath = (
  config: NormalizedConfig,
  type: keyof DistPathConfig,
): string => {
  const { distPath } = config.output;
  const ret = distPath[type];
  if (typeof ret !== 'string') {
    throw new Error(`unknown key ${type} in "output.distPath"`);
  }
  return ret;
};

export const getFilename = (
  config: NormalizedConfig,
  type: keyof FilenameConfig,
  isProd: boolean,
) => {
  const { filename } = config.output;
  const useHash = isProd && !config.output.disableFilenameHash;
  const hash = useHash ? '.[contenthash:8]' : '';

  switch (type) {
    case 'js':
      return filename.js ?? `[name]${hash}.js`;
    case 'css':
      return filename.css ?? `[name]${hash}.css`;
    case 'svg':
      return filename.svg ?? `[name].[contenthash:8].svg`;
    case 'font':
      return filename.font ?? `[name].[contenthash:8][ext]`;
    case 'image':
      return filename.image ?? `[name].[contenthash:8][ext]`;
    case 'media':
      return filename.media ?? `[name].[contenthash:8][ext]`;
    default:
      throw new Error(`unknown key ${type} in "output.filename"`);
  }
};
