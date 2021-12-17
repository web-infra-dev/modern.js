import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

export const cwdFileChange = (list: any) => {
  const cwd = process.cwd();
  const umdPath = path.resolve(cwd, 'dist/umd');
  const umdFile = path.resolve(cwd, 'dist/umd/index.js');
  const watcher = chokidar.watch(umdPath);

  watcher.on('all', (e, pth) => {
    if (umdFile === pth) {
      for (const [, fn] of list) {
        fn({
          content: fs.readFileSync(umdFile),
        });
      }
    }
  });
};
