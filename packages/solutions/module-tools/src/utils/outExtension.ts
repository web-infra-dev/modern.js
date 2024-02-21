import path from 'path';
import { fs, logger } from '@modern-js/utils';
import type { Format } from '../types';

export const getDefaultOutExtension = (options: {
  format: Format;
  root: string;
  autoExtension: boolean;
}) => {
  const { format, root, autoExtension } = options;
  let jsExtension = '.js';
  let dtsExtension = '.d.ts';
  if (!autoExtension) {
    return {
      jsExtension,
      dtsExtension,
    };
  }
  let isModule = false;
  try {
    const json = JSON.parse(
      fs.readFileSync(path.resolve(root, './package.json'), 'utf8'),
    );
    isModule = json.type === 'module';
  } catch (e) {
    logger.warn('package.json is broken');
    return {
      jsExtension,
      dtsExtension,
    };
  }

  if (isModule && format === 'cjs') {
    jsExtension = '.cjs';
    dtsExtension = '.d.cts';
  }
  if (!isModule && format === 'esm') {
    jsExtension = '.mjs';
    dtsExtension = '.d.mts';
  }
  return {
    jsExtension,
    dtsExtension,
    isModule,
  };
};
