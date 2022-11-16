import fs from 'fs';
import path, { basename, dirname, extname } from 'path';
import { gen } from './gen-config';

const walk = (dir: string) => {
  const fl: string[] = [];
  fs.readdirSync(dir).forEach(ff => {
    const fpath = path.join(dir, ff);
    if (fs.statSync(fpath).isDirectory()) {
      fl.push(...walk(fpath));
    } else if (extname(fpath) === '.md') {
      fl.push(fpath);
    }
  });
  return fl;
};

const summary = (lng: string) => {
  const fl = walk(
    path.join(
      process.cwd(),
      `./node_modules/@modern-js/builder-doc/${lng}/config`,
    ),
  );
  return fl.map(fpath => {
    return {
      name: basename(fpath).replace(extname(fpath), ''),
      dirname: basename(dirname(fpath)),
    };
  });
};

gen({
  zh: summary('zh'),
  en: summary('en'),
});
