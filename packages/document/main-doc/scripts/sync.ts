import path, { basename, dirname, extname } from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { diff, gen } from './config';
import { cloneRsbuildRepo } from './repo';
import { camelize, replaceRsbuildLink } from './utils';

const walk = (dir: string, { root, lng }: { root: boolean; lng: string }) => {
  const fl: string[] = [];
  fs.readdirSync(dir).forEach(ff => {
    const fpath = path.join(dir, ff);
    if (fs.statSync(fpath).isDirectory()) {
      fl.push(...walk(fpath, { root: false, lng }));
    } else if (extname(fpath) === '.mdx' && !root) {
      fl.push(fpath);
      replaceRsbuildLink(fpath, lng);
    }
  });
  return fl;
};

const summary = (rebuildWebsiteDir: string, lng: string) => {
  const fl = walk(path.join(rebuildWebsiteDir, `${lng}/config`), {
    root: true,
    lng,
  });
  const json = fl.map(fpath => {
    return {
      name: camelize(basename(fpath).replace(extname(fpath), '')),
      dirname: basename(dirname(fpath)),
    };
  });

  return json;
};

// clone rsbuild repo
async function main() {
  const spinner = ora('clone rebuild doc...').start(); // 开始加载动画
  const rebuildRepoDir = await cloneRsbuildRepo();
  spinner.stop();
  const rebuildWebsiteDir = path.join(process.cwd(), 'rsbuild-doc');
  fs.cpSync(path.join(rebuildRepoDir, 'website', 'docs'), rebuildWebsiteDir, {
    recursive: true,
  });
  const zh = summary(rebuildWebsiteDir, 'zh');
  const en = summary(rebuildWebsiteDir, 'en');

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
}

main();
