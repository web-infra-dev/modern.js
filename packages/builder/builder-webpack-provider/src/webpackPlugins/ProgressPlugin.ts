import type Buffer from 'buffer';
import { createHash, Encoding } from 'crypto';
import { bus } from '../progress/bus';
import type { Props } from '../progress/type';
import { webpack } from '../types';
/**
 * Get content hash.
 */
export function getHash(
  content: Buffer | string,
  encoding: Encoding,
  type = 'md5',
): string {
  return createHash(type).update(content.toString(), encoding).digest('hex');
}

export interface IProgressOptions
  extends Omit<Props, 'message' | 'total' | 'current' | 'done'> {
  quiet: boolean;
  quietOnDev: boolean;
  id: string;
  clearOnDone: boolean;
}

export const UseWebpackProgressPlugin = (
  options: Partial<IProgressOptions>,
  webpack: typeof import('webpack'),
): webpack.WebpackPluginInstance | undefined => {
  const {
    id = 'Modern',
    quiet = false,
    quietOnDev = false,
    clearOnDone = false,
  } = options;

  const total = 100;
  const done = false;

  if (quiet) {
    return undefined;
  }
  if (quietOnDev && process.env.NODE_ENV === 'development') {
    return undefined;
  }

  return new webpack.ProgressPlugin({
    activeModules: false,
    entries: true,
    handler(percentage: any, message: any) {
      if (process.stdout.isTTY) {
        if (!done && percentage > 0) {
          bus.update({
            id,
            current: percentage * 100,
            message,
            total,
            done,
          });
          bus.render();
        } else if (percentage === 1 && clearOnDone) {
          bus.clear();
        }
      }
    },
    modules: true,
    modulesCount: 5000,
    profile: false,
    dependencies: true,
    dependenciesCount: 10000,
    percentBy: null,
  });
};
