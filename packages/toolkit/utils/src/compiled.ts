import yaml from '../compiled/js-yaml';
import upath from '../compiled/upath';
import chalk from '../compiled/chalk';
import pkgUp from '../compiled/pkg-up';
import gzipSize from '../compiled/gzip-size';
import { Import } from './import';

const debug: typeof import('../compiled/debug') = Import.lazy(
  '../compiled/debug',
  require,
);

const filesize: typeof import('../compiled/filesize') = Import.lazy(
  '../compiled/filesize',
  require,
);

const stripAnsi: typeof import('../compiled/strip-ansi') = Import.lazy(
  '../compiled/strip-ansi',
  require,
);

export { yaml, chalk, debug, upath, pkgUp, filesize, stripAnsi, gzipSize };
