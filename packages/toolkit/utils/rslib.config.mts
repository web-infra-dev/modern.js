import { rslibConfig } from '@modern-js/rslib';
import { type RslibConfig, type Rspack, defineConfig } from '@rslib/core';

const dependencies = [
  // zero dependency
  'address',
  'filesize',
  'minimist',
  {
    name: 'commander',
    esm: true,
  },
  'import-lazy',
  'dotenv',
  'dotenv-expand',
  'url-join',
  'slash',
  {
    name: 'nanoid',
    esm: true,
  },
  'lodash',
  {
    name: 'upath',
  },
  // a few dependencies
  'debug',
  'semver',
  {
    name: 'js-yaml',
    esm: true,
  },
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
    esm: true,
    externals: {
      json5: '../json5',
      minimist: '../minimist',
    },
  },
];

const externalsMap: Record<string, { esm: boolean; regex: RegExp }> = {};

for (const item of dependencies) {
  const depName = typeof item === 'string' ? item : item.name;

  // Skip dtsOnly dependencies
  if (typeof item !== 'string' && 'dtsOnly' in item) {
    continue;
  }

  externalsMap[depName] = {
    esm: Boolean(typeof item === 'object' && item.esm),
    regex: new RegExp(`compiled[\\/]${depName}(?:[\\/]|$)`),
  };
}

const externals: Rspack.Configuration['externals'] = [
  // externalize pre-bundled dependencies
  ({ request }, callback) => {
    const entries = Object.entries(externalsMap);
    if (request) {
      for (const [name, { regex, esm }] of entries) {
        if (request === name) {
          throw new Error(
            `"${name}" is not allowed to be imported, use "../compiled/${name}/index.js" instead.`,
          );
        }
        if (regex.test(request)) {
          const index = esm ? 'index.mjs' : 'index.js';
          return callback(undefined, `module-import ${request}/${index}`);
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
  if (config.format === 'cjs') {
    return {
      ...config,
      output: {
        ...config.output,
        externals: {
          // remove import-meta-resolve from cjs bundle to solve jest error
          'import-meta-resolve': 'var {}',
        },
        copy: [
          {
            from: './compiled',
            to: '../compiled',
          },
        ],
      },
    };
  }
  return config;
});

export default defineConfig({
  ...rslibConfig,
  lib,
});
