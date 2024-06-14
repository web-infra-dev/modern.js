/**
 * Set test cases "private": true in package.json
 * to avoid changesets calculate version for this pkgs
 */
import fs from 'fs';
import path from 'path';
import { fastGlob } from '@modern-js/utils';

const run = () => {
  const root = path.join(__dirname, '../integration');
  const files = fastGlob.sync('**/package.json', {
    cwd: root,
    ignore: ['**/node_modules/**'],
  });

  files.forEach(file => {
    const pkgPath = path.join(root, file);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (pkg.private !== true) {
      pkg.private = true;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log('Done:', pkgPath);
    }
  });
};

run();
