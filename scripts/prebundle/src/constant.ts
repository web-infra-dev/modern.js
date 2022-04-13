import { join } from 'path';

export const ROOT_DIR = join(__dirname, '..', '..', '..');
export const PACKAGES_DIR = join(ROOT_DIR, 'packages');
export const DIST_DIR = 'compiled';

type Task = {
  packageDir: string;
  packageName: string;
  dependencies: Array<
    | string
    | {
        /** Name of dependency */
        name: string;
        /** Whether to minify the code. */
        minify?: boolean;
        /** External some sub-dependencies. */
        externals?: Record<string, string>;
        /** Copy fields from original package.json to target package.json. */
        packageJsonField?: string[];
      }
  >;
};

/**
 * 1. 优先打「零依赖」的包，使 externals 能更好地生效
 * 2. 预打包的依赖请锁死到固定版本
 */
export const TASKS: Task[] = [
  {
    packageDir: 'toolkit/utils',
    packageName: '@modern-js/utils',
    dependencies: [
      // zero dependency
      'upath',
      'filesize',
      'commander',
      'import-lazy',
      // a few dependencies
      'debug',
      'js-yaml',
      'strip-ansi',
      'gzip-size',
      'pkg-up',
      'recursive-readdir',
      // more dependencies
      'glob',
      'chalk',
      {
        name: 'signale',
        externals: {
          // ncc bundled wrong package.json, using external to avoid this problem
          './package.json': './package.json',
        },
        packageJsonField: ['options'],
      },
      'execa',
      'fs-extra',
      'browserslist',
      'chokidar',
    ],
  },
];
