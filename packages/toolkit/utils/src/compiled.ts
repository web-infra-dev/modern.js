import chalk from '../compiled/chalk';
import pkgUp from '../compiled/pkg-up';
import gzipSize from '../compiled/gzip-size';
import { Import } from './import';

const filesize: typeof import('../compiled/filesize') = Import.lazy(
  '../compiled/filesize',
  require,
);

const stripAnsi: typeof import('../compiled/strip-ansi') = Import.lazy(
  '../compiled/strip-ansi',
  require,
);

export { chalk, pkgUp, filesize, stripAnsi, gzipSize };
