import { join } from 'path';

export const ROOT_DIR = join(__dirname, '..', '..', '..');
export const PACKAGES_DIR = join(ROOT_DIR, 'packages');
export const DIST_DIR = 'compiled';

/**
 * 1. 优先打「零依赖」的包，使 externals 能更好地生效
 * 2. 预打包的依赖请锁死到固定版本
 */
export const TASKS = [
  {
    packageDir: 'toolkit/utils',
    packageName: '@modern-js/utils',
    dependencies: [
      // zero dependency
      'upath',
      'filesize',
      'import-lazy',
      // a few dependencies
      'debug',
      'js-yaml',
      'strip-ansi',
      'gzip-size',
      'pkg-up',
      // more dependencies
      'chalk',
    ],
  },
];
