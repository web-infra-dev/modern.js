import path, { basename, dirname, extname } from 'path';
import fs from 'fs-extra';
import { diff, gen } from './config';

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
  const json = fl.map(fpath => {
    return {
      name: basename(fpath).replace(extname(fpath), ''),
      dirname: basename(dirname(fpath)),
    };
  });

  return json;
};

const zh = summary('zh');
const en = summary('en');

// 寻找已经过时的配置，并删除
const outdated = diff({
  zh,
  en,
});

outdated.forEach(uri => {
  if (fs.existsSync(uri)) {
    fs.unlinkSync(uri);
  }
});

// 生成新的配置
fs.writeJSONSync(path.join(__dirname, 'summary.en.json'), en);
fs.writeJSONSync(path.join(__dirname, 'summary.zh.json'), zh);

gen({
  zh,
  en,
});
