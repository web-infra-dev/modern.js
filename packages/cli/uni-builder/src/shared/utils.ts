import type {
  RsbuildTarget,
  NormalizedConfig,
  FilenameConfig,
} from '@rsbuild/core';

export const RUNTIME_CHUNK_NAME = 'builder-runtime';

export const TS_REGEX = /\.(?:ts|mts|cts|tsx)$/;

export function isServerTarget(target: RsbuildTarget[]) {
  return (Array.isArray(target) ? target : [target]).some(item =>
    ['node', 'service-worker'].includes(item),
  );
}

export function getFilename(
  config: NormalizedConfig,
  type: 'js',
  isProd: boolean,
): NonNullable<FilenameConfig['js']>;
export function getFilename(
  config: NormalizedConfig,
  type: Exclude<keyof FilenameConfig, 'js'>,
  isProd: boolean,
): string;
export function getFilename(
  config: NormalizedConfig,
  type: keyof FilenameConfig,
  isProd: boolean,
) {
  const { filename, filenameHash } = config.output;

  const getHash = () => {
    if (typeof filenameHash === 'string') {
      return filenameHash ? `.[${filenameHash}]` : '';
    }
    return filenameHash ? '.[contenthash:8]' : '';
  };

  const hash = getHash();

  switch (type) {
    case 'js':
      return filename.js ?? `[name]${isProd ? hash : ''}.js`;
    case 'css':
      return filename.css ?? `[name]${isProd ? hash : ''}.css`;
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
}
