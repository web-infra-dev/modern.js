import path from 'path';
import fs from 'fs-extra';
import zh from './summary.zh.json';
import en from './summary.en.json';

const jsonMap = {
  zh,
  en,
};

const tip: Record<string, string> = {
  zh: '该配置为 Modern.js Builder 配置，可能存在无法跳转的链接。详细信息可参考',
  en: 'This configuration is Modern.js Builder configuration, there may be links that cannot be redirected. for details, please refer to',
};

const createMarkdown = (
  summary: {
    dirname: string;
    name: string;
    text: string;
  },
  key: string,
) => {
  const { name, dirname } = summary;

  return `---
title: ${dirname}.${name}
sidebar_label: ${name}
sidebar_position: 1
---

:::info BUILDER
${
  tip[key]
} [${dirname}.${name}](https://modernjs.dev/builder/zh/api/config-${dirname}.html#${dirname}-${name.toLowerCase()})。
:::

import Main from '@modern-js/builder-doc/${key}/config/${dirname}/${name}.md'

<Main />
`;
};

const hyphenateRE = /\B([A-Z]+)/g;
const hyphenate = function (str: string) {
  return str.replace(hyphenateRE, '-$1').toLowerCase();
};

const configPath = 'configure/app';
Object.keys(jsonMap).forEach(key => {
  const cwd = process.cwd();
  const baseDir =
    key === 'zh'
      ? path.join(cwd, `docs/${configPath}`)
      : path.join(
          cwd,
          `i18n/${key}/docusaurus-plugin-content-docs/current/${configPath}`,
        );

  const json = jsonMap[key as 'zh' | 'en'];
  json.forEach(summary => {
    const mdDir = path.join(baseDir, summary.dirname);
    const mdPath = path.join(mdDir, `${hyphenate(summary.name)}.md`);
    if (!fs.existsSync(mdDir)) {
      fs.mkdirpSync(mdDir);
    }
    fs.writeFileSync(mdPath, createMarkdown(summary, key));
  });
});
