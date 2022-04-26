import fs from '../compiled/fs-extra';
import chalk from '../compiled/chalk';
import lodash from '../compiled/lodash';
import signale from '../compiled/signale';
import minimist from '../compiled/minimist';
import slash from '../compiled/slash';
import { Import } from './import';

export { fs, chalk, lodash, signale, minimist, slash };
export { program, Command } from '../compiled/commander';
export { Signale, SignaleOptions } from '../compiled/signale';
export type { IOptions as GlobOptions } from '../compiled/glob';
export type { GlobbyOptions } from '../compiled/globby';
export type { FSWatcher, WatchOptions } from '../compiled/chokidar';

export const ora: typeof import('../compiled/ora') = Import.lazy(
  '../compiled/ora',
  require,
);

export const glob: typeof import('../compiled/glob') = Import.lazy(
  '../compiled/glob',
  require,
);

export const fastGlob: typeof import('../compiled/fast-glob') = Import.lazy(
  '../compiled/fast-glob',
  require,
);

export const globby: typeof import('../compiled/globby') = Import.lazy(
  '../compiled/globby',
  require,
);

export const mime: typeof import('../compiled/mime-types') = Import.lazy(
  '../compiled/mime-types',
  require,
);

export const yaml: typeof import('../compiled/js-yaml') = Import.lazy(
  '../compiled/js-yaml',
  require,
);

export const execa: typeof import('../compiled/execa') = Import.lazy(
  '../compiled/execa',
  require,
);

export const json5: typeof import('../compiled/json5') = Import.lazy(
  '../compiled/json5',
  require,
);

export const urlJoin: typeof import('../compiled/url-join') = Import.lazy(
  '../compiled/url-join',
  require,
);

export const pkgUp: typeof import('../compiled/pkg-up') = Import.lazy(
  '../compiled/pkg-up',
  require,
);

export const upath: typeof import('../compiled/upath') = Import.lazy(
  '../compiled/upath',
  require,
);

export const debug: typeof import('../compiled/debug') = Import.lazy(
  '../compiled/debug',
  require,
);

export const address: typeof import('../compiled/address') = Import.lazy(
  '../compiled/address',
  require,
);

export const dotenv: typeof import('../compiled/dotenv') = Import.lazy(
  '../compiled/dotenv',
  require,
);

export const inquirer: typeof import('../compiled/inquirer') = Import.lazy(
  '../compiled/inquirer',
  require,
);

export const dotenvExpand: typeof import('../compiled/dotenv-expand') =
  Import.lazy('../compiled/dotenv-expand', require);

export const chokidar: typeof import('../compiled/chokidar') = Import.lazy(
  '../compiled/chokidar',
  require,
);

export const gzipSize: typeof import('../compiled/gzip-size') = Import.lazy(
  '../compiled/gzip-size',
  require,
);

export const filesize: typeof import('../compiled/filesize') = Import.lazy(
  '../compiled/filesize',
  require,
);

export const stripAnsi: typeof import('../compiled/strip-ansi') = Import.lazy(
  '../compiled/strip-ansi',
  require,
);

export const browserslist: typeof import('../compiled/browserslist') =
  Import.lazy('../compiled/browserslist', require);

export const recursiveReaddir: typeof import('../compiled/recursive-readdir') =
  Import.lazy('../compiled/recursive-readdir', require);
