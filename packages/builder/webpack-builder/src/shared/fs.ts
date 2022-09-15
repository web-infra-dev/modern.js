import type { GlobbyOptions } from '@modern-js/utils/globby';
import fs, { PathLike } from 'fs';
import { join } from 'path';
import type { BuilderConfig, DistPathConfig, FilenameConfig } from '../types';
import {
  CSS_DIST_DIR,
  FONT_DIST_DIR,
  HTML_DIST_DIR,
  IMAGE_DIST_DIR,
  JS_DIST_DIR,
  MEDIA_DIST_DIR,
  ROOT_DIST_DIR,
  SVG_DIST_DIR,
} from './constants';

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
): string => {
  const { distPath = {} } = config.output || {};

  switch (type) {
    case 'js':
      return distPath.js ?? JS_DIST_DIR;
    case 'css':
      return distPath.css ?? CSS_DIST_DIR;
    case 'svg':
      return distPath.svg ?? SVG_DIST_DIR;
    case 'font':
      return distPath.font ?? FONT_DIST_DIR;
    case 'html':
      return distPath.html ?? HTML_DIST_DIR;
    case 'media':
      return distPath.media ?? MEDIA_DIST_DIR;
    case 'root':
      return distPath.root ?? ROOT_DIST_DIR;
    case 'image':
      return distPath.image ?? IMAGE_DIST_DIR;
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

export interface GlobContentJSONOptions extends GlobbyOptions {
  maxSize?: number;
}

export const globContentJSON = async (
  paths: string | string[],
  options?: GlobContentJSONOptions,
) => {
  const { globby, fs } = await import('@modern-js/utils');
  const files = await globby(paths, options);
  let totalSize = 0;
  const maxSize = 1024 * (options?.maxSize ?? 4096);
  const ret: Record<string, string> = {};
  for await (const file of files) {
    const { size } = await fs.stat(file);
    totalSize += size;
    if (maxSize && totalSize > maxSize) {
      throw new Error('too large');
    }
    ret[file] = await fs.readFile(file, 'utf-8');
  }
  return ret;
};

export const filenameToGlobExpr = (file: PathLike) =>
  fs.statSync(file).isDirectory() ? `${file}/**/*` : file;
