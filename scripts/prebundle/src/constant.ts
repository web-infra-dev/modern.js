import { basename, join } from 'path';
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
    packageDir: 'builder/builder-shared',
    packageName: '@modern-js/builder-shared',
    dependencies: [
      'open',
      'webpack-merge',
      'serialize-javascript',
      {
        name: 'pretty-time',
        ignoreDts: true,
      },
      {
        name: 'postcss-modules-local-by-default',
        ignoreDts: true,
      },
      {
        name: 'postcss-modules-extract-imports',
        ignoreDts: true,
      },
      {
        name: 'postcss-modules-scope',
        ignoreDts: true,
      },
      {
        name: 'postcss-modules-values',
        ignoreDts: true,
      },
      {
        name: 'icss-utils',
        ignoreDts: true,
      },
      {
        name: 'css-loader',
        ignoreDts: true,
        externals: {
          'postcss-modules-local-by-default':
            '../postcss-modules-local-by-default',
          'postcss-modules-extract-imports':
            '../postcss-modules-extract-imports',
          'postcss-modules-scope': '../postcss-modules-scope',
          'postcss-modules-values': '../postcss-modules-values',
          'icss-utils': '../icss-utils',
        },
      },
      {
        name: 'webpack-bundle-analyzer',
        externals: {
          acorn: 'acorn',
          commander: '@modern-js/utils/commander',
          'gzip-size': '@modern-js/utils/gzip-size',
        },
      },
      {
        name: 'postcss-pxtorem',
        ignoreDts: true,
      },
      {
        name: 'postcss-loader',
        ignoreDts: true,
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
      {
        name: 'autoprefixer',
        ignoreDts: true,
        externals: {
          browserslist: '@modern-js/utils/browserslist',
          'postcss-value-parser': '../postcss-value-parser',
        },
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
        name: 'less-loader',
        ignoreDts: true,
        externals: {
          less: '../less',
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
        name: 'sass-loader',
        externals: {
          sass: '../sass',
        },
      },
      {
        name: 'resolve-url-loader',
        ignoreDts: true,
        externals: {
          'loader-utils': '../loader-utils2',
        },
      },
      {
        name: 'toml-loader',
        ignoreDts: true,
      },
      {
        name: 'babel-loader',
        ignoreDts: true,
      },
      {
        name: 'loader-utils2',
        ignoreDts: true,
        externals: {
          json5: '@modern-js/utils/json5',
        },
      },
      {
        name: 'yaml-loader',
        ignoreDts: true,
        externals: {
          'loader-utils': '../loader-utils2',
        },
      },
      {
        name: 'node-loader',
        ignoreDts: true,
        externals: {
          'loader-utils': '../loader-utils2',
        },
      },
      {
        name: 'schema-utils3',
        ignoreDts: true,
      },
      {
        name: 'url-loader',
        ignoreDts: true,
        externals: {
          'schema-utils': '../schema-utils3',
          'loader-utils': '../loader-utils2',
          'mime-types': '@modern-js/utils/mime-types',
        },
        afterBundle(task) {
          replaceFileContent(join(task.distPath, 'index.js'), content => {
            // using prebunled file-loader
            return content.replace(
              '"file-loader"',
              'require.resolve("../file-loader")',
            );
          });
        },
      },
      {
        name: 'file-loader',
        ignoreDts: true,
        externals: {
          'schema-utils': '../schema-utils3',
          'loader-utils': '../loader-utils2',
        },
      },
      {
        name: 'pug',
        afterBundle(task) {
          replaceFileContent(
            join(task.distPath, 'index.d.ts'),
            content =>
              `${content.replace(
                "declare module 'pug'",
                'declare namespace pug',
              )}\nexport = pug;`,
          );
        },
      },
      {
        name: 'webpack-dev-middleware',
        externals: {
          'schema-utils': '../schema-utils3',
          'schema-utils/declarations/validate':
            'schema-utils/declarations/validate',
          'mime-types': '@modern-js/utils/mime-types',
        },
      },
    ],
  },
  {
    packageDir: 'builder/builder-webpack-provider',
    packageName: '@modern-js/builder-webpack-provider',
    dependencies: [
      'tapable',
      'ansi-escapes',
      'patch-console',
      'cli-truncate',
      {
        name: 'webpack-sources',
        ignoreDts: true,
      },
      {
        name: 'schema-utils3',
        ignoreDts: true,
      },
      {
        name: 'babel-plugin-transform-react-remove-prop-types',
        ignoreDts: true,
      },
      {
        name: 'babel-plugin-lodash',
        ignoreDts: true,
        externals: {
          glob: '@modern-js/utils/glob',
        },
        // Fix the deprecated babel API
        // https://github.com/lodash/babel-plugin-lodash/issues/259
        // https://github.com/lodash/babel-plugin-lodash/pull/261
        beforeBundle(task) {
          const mainFile = join(task.depPath, 'lib/index.js');
          replaceFileContent(mainFile, content => {
            return content.replace(
              '(0, _types.isModuleDeclaration)(node)',
              '(0, _types.isImportDeclaration)(node) || (0, _types.isExportDeclaration)(node)',
            );
          });
        },
      },
      {
        name: 'copy-webpack-plugin',
        ignoreDts: true,
        externals: {
          globby: '@modern-js/utils/globby',
          'fast-glob': '@modern-js/utils/fast-glob',
          'schema-utils': '../schema-utils3',
        },
      },
      {
        name: 'webpack-manifest-plugin',
        externals: {
          tapable: '../tapable',
          'webpack-sources': '../webpack-sources',
        },
        beforeBundle() {
          const pkgPath = require.resolve(
            'webpack-manifest-plugin/package.json',
          );
          replaceFileContent(pkgPath, content => {
            const json = JSON.parse(content);
            json.types = 'dist/index.d.ts';
            return JSON.stringify(json);
          });
        },
      },
    ],
  },
  {
    packageDir: 'builder/plugin-esbuild',
    packageName: '@modern-js/builder-plugin-esbuild',
    dependencies: [
      {
        name: 'esbuild-loader',
        ignoreDts: true,
        externals: {
          '/^webpack(/.*)/': '@modern-js/builder-webpack-provider/webpack$1',
        },
        afterBundle(task) {
          const dtsFiles = glob.sync(join(task.depPath, 'dist', '*.d.ts'), {
            ignore: ['**/__tests__/**'],
          });
          dtsFiles.forEach(file => {
            copyFileSync(file, join(task.distPath, basename(file)));
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
