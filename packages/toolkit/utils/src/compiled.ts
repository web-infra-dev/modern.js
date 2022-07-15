import { Import } from './import';

export { default as fs } from '../compiled/fs-extra';
export { default as ora } from '../compiled/ora';
export { default as glob } from '../compiled/glob';
export { default as yaml } from '../compiled/js-yaml';
export { default as chalk } from '../compiled/chalk';
export { default as debug } from '../compiled/debug';
export { default as slash } from '../compiled/slash';
export { default as execa } from '../compiled/execa';
export { default as json5 } from '../compiled/json5';
export { default as upath } from '../compiled/upath';
export { default as pkgUp } from '../compiled/pkg-up';
export { nanoid } from '../compiled/nanoid';
export { default as semver } from '../compiled/semver';
export { default as dotenv } from '../compiled/dotenv';
export { default as lodash } from '../compiled/lodash';
export { default as globby } from '../compiled/globby';
export { default as address } from '../compiled/address';
export { default as signale } from '../compiled/signale';
export { default as urlJoin } from '../compiled/url-join';
export { default as minimist } from '../compiled/minimist';
export { default as fastGlob } from '../compiled/fast-glob';
export { default as filesize } from '../compiled/filesize';
export { default as gzipSize } from '../compiled/gzip-size';
export { default as stripAnsi } from '../compiled/strip-ansi';
export { default as dotenvExpand } from '../compiled/dotenv-expand';
export { default as browserslist } from '../compiled/browserslist';
export { default as recursiveReaddir } from '../compiled/recursive-readdir';

export { program, Command } from '../compiled/commander';
export { Signale } from '../compiled/signale';
export type { SignaleOptions } from '../compiled/signale';
export type { IOptions as GlobOptions } from '../compiled/glob';
export type { GlobbyOptions } from '../compiled/globby';
export type { FSWatcher, WatchOptions } from '../compiled/chokidar';
export type { ExecaError } from '../compiled/execa';
export type { default as WebpackChain } from '../compiled/webpack-chain';

/**
 * Lazy import some expensive modules that will slow down startup speed.
 * Notice that `csmith-tools build` can not bundle lazy imported modules.
 */
export const mime: typeof import('../compiled/mime-types') = Import.lazy(
  '../compiled/mime-types',
  require,
);
export const chokidar: typeof import('../compiled/chokidar') = Import.lazy(
  '../compiled/chokidar',
  require,
);
export const inquirer: typeof import('../compiled/inquirer') = Import.lazy(
  '../compiled/inquirer',
  require,
);
