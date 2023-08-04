import { basename, join } from 'path';
import glob from 'fast-glob';
import { copyFileSync, copySync, moveSync } from 'fs-extra';
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
      'recursive-readdir',
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
      {
        name: 'webpack-chain',
        externals: {
          tapable: 'tapable',
        },
      },
      {
        name: 'ajv',
        beforeBundle(task) {
          replaceFileContent(task.depEntry, content => {
            const addExports = `exports.codegen = require("./compile/codegen");`;
            if (content.includes(addExports)) {
              return content;
            }
            return `${content}\n${addExports}`;
          });
        },
        afterBundle(task) {
          // Fix dts-packer failed to handle uri-js type
          moveSync(
            join(task.distPath, 'uri-js/dist/es5/uri.all.d.ts'),
            join(task.distPath, 'uri-js.d.ts'),
          );
        },
        emitFiles: [
          {
            path: 'codegen.js',
            content: `module.exports = require('./').codegen;`,
          },
          {
            path: 'types/vocabularies/errors.d.ts',
            content: 'export type DefinedError = any;',
          },
        ],
      },
      {
        name: 'ajv-keywords',
        ignoreDts: true,
        externals: {
          ajv: '../ajv',
          'ajv/dist/compile/codegen': '../ajv/codegen',
        },
      },
      {
        name: 'better-ajv-errors',
        ignoreDts: true,
        externals: {
          ajv: '../ajv',
        },
      },
      {
        name: 'webpack-dev-middleware',
        externals: {
          'schema-utils': '../schema-utils3',
          'schema-utils/declarations/validate':
            'schema-utils/declarations/validate',
          'mime-types': '../mime-types',
        },
      },
    ],
  },
  {
    packageDir: 'builder/builder-shared',
    packageName: '@modern-js/builder-shared',
    dependencies: [
      'open',
      'webpack-5-chain',
      'serialize-javascript',
      {
        name: 'css-loader',
        ignoreDts: true,
      },
      {
        name: 'webpack-bundle-analyzer',
        externals: {
          chalk: '@modern-js/utils/chalk',
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
    ],
  },
  {
    packageDir: 'builder/builder-webpack-provider',
    packageName: '@modern-js/builder-webpack-provider',
    dependencies: [
      'tapable',
      'webpack-merge',
      'ansi-escapes',
      'patch-console',
      'cli-truncate',
      {
        name: 'pretty-time',
        ignoreDts: true,
      },
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
    packageDir: 'builder/builder-rspack-provider',
    packageName: '@modern-js/builder-rspack-provider',
    dependencies: [
      'webpack-merge',
      {
        name: 'pretty-time',
        ignoreDts: true,
      },
    ],
  },
  {
    packageDir: 'cli/babel-preset-base',
    packageName: '@modern-js/babel-preset-base',
    dependencies: [
      {
        name: '@babel/helper-plugin-utils',
        ignoreDts: true,
      },
      {
        name: '@babel/helper-annotate-as-pure',
        ignoreDts: true,
      },
      {
        name: '@babel/helper-module-imports',
        ignoreDts: true,
      },
      {
        name: 'babel-plugin-dynamic-import-node',
        ignoreDts: true,
      },
      {
        name: 'babel-plugin-import',
        ignoreDts: true,
        externals: {
          '@babel/helper-module-imports': '../@babel/helper-module-imports',
        },
      },
      {
        name: 'babel-plugin-styled-components',
        ignoreDts: true,
        externals: {
          '@babel/helper-module-imports': '../@babel/helper-module-imports',
          '@babel/helper-annotate-as-pure': '../@babel/helper-annotate-as-pure',
        },
      },
      {
        name: '@babel/plugin-proposal-pipeline-operator',
        ignoreDts: true,
        externals: {
          '@babel/helper-plugin-utils': '../helper-plugin-utils',
        },
      },
      {
        name: '@babel/plugin-proposal-export-default-from',
        ignoreDts: true,
        externals: {
          '@babel/helper-plugin-utils': '../helper-plugin-utils',
        },
      },
      {
        name: '@babel/plugin-proposal-partial-application',
        ignoreDts: true,
        externals: {
          '@babel/helper-plugin-utils': '../helper-plugin-utils',
        },
      },
      {
        name: '@babel/helper-create-class-features-plugin',
        ignoreDts: true,
        externals: {
          '@babel/template': '@babel/template',
        },
      },
      {
        name: '@babel/plugin-proposal-decorators',
        ignoreDts: true,
        externals: {
          '@babel/helper-plugin-utils': '../helper-plugin-utils',
          '@babel/helper-create-class-features-plugin':
            '../helper-create-class-features-plugin',
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
      {
        name: 'rollup-plugin-dts',
        externals: {
          typescript: 'typescript',
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
