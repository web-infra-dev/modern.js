import { rslibConfig } from '@modern-js/rslib';
import { type RslibConfig, type Rspack, defineConfig } from '@rslib/core';

const dependencies = [
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
  'lodash',
  {
    name: 'upath',
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
  },
];

const regexpMap: Record<string, RegExp> = {};

for (const item of dependencies) {
  const depName = typeof item === 'string' ? item : item.name;

  // Skip dtsOnly dependencies
  if (typeof item !== 'string' && 'dtsOnly' in item) {
    continue;
  }

  regexpMap[depName] = new RegExp(`compiled[\\/]${depName}(?:[\\/]|$)`);
}

const externals: Rspack.Configuration['externals'] = [
  // externalize pre-bundled dependencies
  ({ request }, callback) => {
    const entries = Object.entries(regexpMap);
    if (request) {
      for (const [name, test] of entries) {
        if (request === name) {
          throw new Error(
            `"${name}" is not allowed to be imported, use "../compiled/${name}/index.js" instead.`,
          );
        }
        if (test.test(request)) {
          return callback(undefined, `module-import ${request}/index.js`);
        }
      }
    }
    callback();
  },
];

const lib: RslibConfig['lib'] = rslibConfig.lib.map((config, index) => {
  if (config.format === 'esm') {
    return {
      ...config,
      output: {
        ...config.output,
        externals,
      },
    };
  }
  return {
    ...config,
    output: {
      ...config.output,
      copy: [
        {
          from: './compiled',
          to: '../compiled',
        },
      ],
    },
  };
});

export default defineConfig({
  ...rslibConfig,
  lib,
});
