import path from 'path';
import { fs } from '@modern-js/utils';

export const copyfile = (
  target: string,
  source: string,
  fl: (string | RegExp)[],
) => {
  fl.forEach(ff => {
    if (!ff) {
      return;
    }
    if (typeof ff === 'string') {
      cpfile(target, source, ff);
      return;
    }

    // the ff instanceof RegExp
    const sourceIncludeFiles = fs.readdirSync(source);
    for (const filename of sourceIncludeFiles) {
      if (ff.test(filename)) {
        cpfile(target, source, filename);
      }
    }
  });

  function cpfile(target: string, source: string, filename: string) {
    const filepath = path.join(source, filename);
    if (!fs.existsSync(filepath)) {
      return;
    }

    const targetPath = path.join(target, filename);

    fs.copySync(filepath, targetPath);
  }
};
