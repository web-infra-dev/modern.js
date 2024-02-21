import { join } from 'path';
import glob from 'fast-glob';
import { copyFileSync, copySync } from 'fs-extra';
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
  esbuild: 'esbuild',
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
      'commander',
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
      {
        name: 'schema-utils3',
        ignoreDts: true,
      },
      // some dependencies
      'glob',
      'chalk',
      'webpack-chain',
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
      'chokidar',
      'fast-glob',
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
        externals: {
          ora: '../ora',
          chalk: '../chalk',
          'strip-ansi': '../strip-ansi',
        },
      },
      {
        name: 'tsconfig-paths',
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
  {
    // Todo: rename
    packageDir: 'solutions/module-tools',
    packageName: '@modern-js/module-tools',
    dependencies: [
      '@rollup/plugin-json',
      'deepmerge',
      'normalize-path',
      'signal-exit',
      'p-map',
      'rollup',
      'find-up',
      '@svgr/core',
      '@svgr/plugin-jsx',
      '@svgr/plugin-svgo',
      {
        name: 'rollup-plugin-dts',
        externals: {
          typescript: 'typescript',
        },
        ignoreDts: true,
        emitDts: false,
        clear: false,
      },
      {
        name: 'less',
        externals: {
          // needle is an optional dependency and no need to bundle it.
          needle: 'needle',
        },
        afterBundle(task) {
          replaceFileContent(join(task.distPath, 'index.d.ts'), content =>
            content.replace(
              `declare module "less" {\n    export = less;\n}`,
              `export = Less;`,
            ),
          );
        },
      },
      {
        name: 'sass',
        externals: {
          chokidar: '@modern-js/utils/chokidar',
        },
        afterBundle(task) {
          copySync(join(task.depPath, 'types'), join(task.distPath, 'types'));
        },
      },
      {
        name: 'postcss-value-parser',
        ignoreDts: true,
      },
      {
        name: 'postcss-custom-properties',
        ignoreDts: true,
        externals: {
          'postcss-value-parser': '../postcss-value-parser',
        },
      },
      {
        name: 'postcss-flexbugs-fixes',
        ignoreDts: true,
      },
      {
        name: 'postcss-font-variant',
        ignoreDts: true,
      },
      {
        name: 'postcss-initial',
        ignoreDts: true,
      },
      {
        name: 'postcss-media-minmax',
        ignoreDts: true,
      },
      {
        name: 'postcss-nesting',
        ignoreDts: true,
      },
      {
        name: 'postcss-page-break',
        ignoreDts: true,
      },
    ],
  },
];
