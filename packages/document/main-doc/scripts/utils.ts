import fs from 'fs-extra';

export const camelize = function (str: string) {
  return str
    .split('-') // 按连字符分割成数组
    .map((word, index) => {
      if (index === 0) {
        // 第一个单词保持小写
        return word.toLowerCase();
      }
      // 其余单词首字母大写，其余部分小写
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(''); // 重新连接成一个字符串
};

const hyphenateRE = /\B([A-Z]+)/g;
export const hyphenate = function (str: string) {
  return str.replace(hyphenateRE, '-$1').toLowerCase();
};

const linkRegex = [
  '/config/',
  '/guide/',
  '/plugins/',
  '/api/',
  '/community/',
  '/shared/',
];
export const replaceRsbuildLink = function (path: string, lang: string) {
  let content = fs.readFileSync(path, 'utf-8');
  linkRegex.forEach(regex => {
    content = content.replaceAll(
      `(${regex}`,
      `(https://rsbuild.dev/${lang}/${regex}/`,
    );
  });
  fs.writeFileSync(path, content, 'utf-8');
};
