import path from 'path';

import { toPosixPath } from './utils';

export default function mapToRelative(cwd, currentFile, module) {
  let from = path.dirname(currentFile);
  let to = path.normalize(module);

  from = path.resolve(cwd, from);
  to = path.resolve(cwd, to);

  const moduleMapped = path.relative(from, to);
  return toPosixPath(moduleMapped);
}
