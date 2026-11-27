import { createHash } from 'crypto';
import path from 'path';

/**
 * Key of an element stage declaration (`viewport`, `interaction`). The build
 * adds it as the second argument of the declaration, and writes the chunks
 * and CSS of each key into the HTML, so the runtime prefetches the files of
 * the element without calling the loader.
 *
 * `file` is relative to the application directory, `line` is 1-based.
 */
export const getElementDeclarationKey = (file: string, line: number) =>
  createHash('md5')
    .update(`${file.split(path.sep).join('/')}:${line}`)
    .digest('hex')
    .slice(0, 8);
