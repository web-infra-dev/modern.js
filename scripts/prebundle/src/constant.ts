import { join } from 'path';
import { replaceFileContent } from './helper';
import type { TaskConfig } from './types';

export const ROOT_DIR = join(__dirname, '..', '..', '..');
export const PACKAGES_DIR = join(ROOT_DIR, 'packages');
export const DIST_DIR = 'compiled';

/**
 * 1. 优先打「零依赖」的包，使 externals 能更好地生效
 * 2. 预打包的依赖请锁死到固定版本
 */
export const TASKS: TaskConfig[] = [
  {
    packageDir: 'toolkit/utils',
    packageName: '@modern-js/utils',
    dependencies: [
      // zero dependency
      'address',
      'lodash',
      'upath',
      'filesize',
      'minimist',
      'commander',
      'import-lazy',
      'dotenv',
      'dotenv-expand',
      'url-join',
      // a few dependencies
      'debug',
      'js-yaml',
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
      // some dependencies
      'glob',
      'chalk',
      {
        name: 'signale',
        externals: {
          chalk: '../chalk',
          // ncc bundled wrong package.json, using external to avoid this problem
          './package.json': './package.json',
        },
        packageJsonField: ['options'],
      },
      'execa',
      'fs-extra',
      'browserslist',
      'chokidar',
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
    ],
  },
  {
    packageDir: 'cli/core',
    packageName: '@modern-js/core',
    dependencies: [
      // zero dependency
      'v8-compile-cache',
      // some dependencies
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
        emitFiles: [
          {
            path: 'codegen.js',
            content: `module.exports = require('./').codegen;`,
          },
        ],
      },
      {
        name: 'ajv-keywords',
        externals: {
          ajv: '../ajv',
          'ajv/dist/compile/codegen': '../ajv/codegen',
        },
      },
      {
        name: 'better-ajv-errors',
        externals: {
          ajv: '../ajv',
        },
      },
    ],
  },
];
