import { join } from 'path';
import glob from 'fast-glob';
import { copyFileSync } from 'fs-extra';
import { copyDeclarations } from './copyDeclarations';
import { replaceFileContent } from './helper';
import type { TaskConfig } from './types';

export const ROOT_DIR = join(__dirname, '..', '..', '..');
export const PACKAGES_DIR = join(ROOT_DIR, 'packages');
export const DIST_DIR = 'compiled';

export const DEFAULT_EXTERNALS = {
  // External caniuse-lite data, so users can update it manually.
  'caniuse-lite': 'caniuse-lite',
  '/^caniuse-lite(/.*)/': 'caniuse-lite$1',
  // External webpack, it's hard to bundle.
  webpack: 'webpack',
  '/^webpack(/.*)/': 'webpack$1',
  // External lodash because lots of packages will depend on it.
  lodash: '@modern-js/utils/lodash',
  '/^lodash(/.*)/': 'lodash$1',
  // ncc bundled wrong package.json, using external to avoid this problem
  './package.json': './package.json',
  '../package.json': './package.json',
  '../../package.json': './package.json',
  postcss: 'postcss',
  '@babel/core': '@babel/core',
  '@babel/types': '@babel/types',
  '@babel/parser': '@babel/parser',
  '@babel/runtime': '@babel/runtime',
  '/^@babel/runtime(/.*)/': '@babel/runtime$1',
};

export const TASKS: TaskConfig[] = [
  {
    packageDir: 'toolkit/utils',
    packageName: '@modern-js/utils',
    dependencies: [
      // zero dependency
      'address',
      'filesize',
      'minimist',
      {
        name: 'commander',
        afterBundle(task) {
          // Keep the same program singleton for require() and import().
          copyFileSync(
            join(task.depPath, 'esm.mjs'),
            join(task.distPath, 'index.mjs'),
          );
        },
      },
      'import-lazy',
      'dotenv',
      'dotenv-expand',
      'url-join',
      'slash',
      'nanoid',
      {
        name: 'upath',
        afterBundle(task) {
          replaceFileContent(
            join(task.distPath, 'upath.d.ts'),
            content =>
              `${content.replace(
                'declare module "upath"',
                'declare namespace upath',
              )}\nexport = upath;`,
          );
        },
      },
      // a few dependencies
      'debug',
      'semver',
      'js-yaml',
      'mime-types',
      'strip-ansi',
      'gzip-size',
      'pkg-up',
      {
        name: 'json5',
        externals: {
          minimist: '../minimist',
        },
      },
      // some dependencies
      { name: 'glob', emitDts: copyDeclarations },
      'chalk',
      {
        name: 'signale',
        externals: {
          chalk: '../chalk',
        },
        packageJsonField: ['options'],
      },
      'execa',
      'fs-extra',
      'browserslist',
      {
        name: 'chokidar',
        beforeBundle(task) {
          // The published bundle needs the macOS watcher even when built on Linux.
          require.resolve('fsevents', { paths: [task.depPath] });
        },
      },
      { name: 'fast-glob', emitDts: copyDeclarations },
      {
        name: 'globby',
        externals: {
          'fast-glob': '../fast-glob',
        },
      },
      {
        name: 'ora',
        externals: {
          chalk: '../chalk',
          'strip-ansi': '../strip-ansi',
        },
      },
      {
        name: 'inquirer',
        emitDts: copyDeclarations,
        externals: {
          ora: '../ora',
          chalk: '../chalk',
          'strip-ansi': '../strip-ansi',
        },
      },
      {
        name: 'tsconfig-paths',
        emitFiles: [
          {
            path: 'index.mjs',
            content: `import tsConfigPaths from './index.js';
export const { register, createMatchPath, matchFromAbsolutePaths, createMatchPathAsync, matchFromAbsolutePathsAsync } = tsConfigPaths;
`,
          },
        ],
        externals: {
          json5: '../json5',
          minimist: '../minimist',
        },
        afterBundle(task) {
          const dtsFiles = glob.sync(join(task.depPath, 'lib', '*.d.ts'), {
            ignore: ['**/__tests__/**'],
          });
          dtsFiles.forEach(file => {
            copyFileSync(file, file.replace(task.depPath, task.distPath));
          });
        },
      },
    ],
  },
];
