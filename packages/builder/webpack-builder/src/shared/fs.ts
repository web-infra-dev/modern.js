import { join } from 'path';
import type { BuilderConfig, DistPathConfig, FilenameConfig } from '../types';

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
  config: BuilderConfig,
  type: keyof DistPathConfig,
) => {
  const { distPath = {} } = config.output;

  switch (type) {
    case 'js':
      return distPath.js;
    case 'css':
      return distPath.css;
    case 'svg':
      return distPath.svg;
    case 'font':
      return distPath.font;
    case 'html':
      return distPath.html;
    case 'media':
      return distPath.media;
    case 'root':
      return distPath.root;
    case 'image':
      return distPath.image;
    default:
      throw new Error(`unknown key ${type} in "output.distPath"`);
  }
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
