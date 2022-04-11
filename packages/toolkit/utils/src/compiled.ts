import fs from '../compiled/fs-extra';
import chalk from '../compiled/chalk';
import { Import } from './import';

export { fs, chalk };

export const yaml: typeof import('../compiled/js-yaml') = Import.lazy(
  '../compiled/js-yaml',
  require,
);

export const execa: typeof import('../compiled/execa') = Import.lazy(
  '../compiled/execa',
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
