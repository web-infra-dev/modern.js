import { join } from 'path';
import type { BuilderConfig, DistPathConfig } from '../types';
import {
  JS_DIST_DIR,
  CSS_DIST_DIR,
  SVG_DIST_DIR,
  FONT_DIST_DIR,
  ROOT_DIST_DIR,
  HTML_DIST_DIR,
  IMAGE_DIST_DIR,
  MEDIA_DIST_DIR,
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
) => {
  const { distPath } = config.output || {};
  const distConfig =
    typeof distPath === 'object' ? distPath : { root: distPath };

  switch (type) {
    case 'js':
      return distConfig.js || JS_DIST_DIR;
    case 'css':
      return distConfig.css || CSS_DIST_DIR;
    case 'svg':
      return distConfig.svg || SVG_DIST_DIR;
    case 'font':
      return distConfig.font || FONT_DIST_DIR;
    case 'html':
      return distConfig.html || HTML_DIST_DIR;
    case 'media':
      return distConfig.media || MEDIA_DIST_DIR;
    case 'root':
      return distConfig.root || ROOT_DIST_DIR;
    case 'image':
      return distConfig.image || IMAGE_DIST_DIR;
    default:
      throw new Error('unknown type');
  }
};
