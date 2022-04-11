import * as path from 'path';
import { glob } from '@modern-js/utils';

export default (rootDir: string, entryPath: string) => {
  const stylesPath = path.resolve(rootDir, 'styles');
  const styleFiles = glob.sync(`${stylesPath}/**/*.@(css|less|sass|scss)`);

  return styleFiles.map(filePath =>
    path.relative(path.dirname(entryPath), filePath),
  );
};
