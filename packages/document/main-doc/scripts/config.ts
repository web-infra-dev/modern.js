import path from 'path';
import fs from 'fs-extra';
import { hyphenate } from './utils';

export type Summary = {
  name: string;
  dirname: string;
};

export type Language = 'en' | 'zh';

const createMarkdown = (summary: Summary, lng: Language) => {
  const { name, dirname } = summary;

  return `---
title: ${name}
---

import Main from '@rsbuild-docs/${lng}/config/${dirname}/${hyphenate(name)}.mdx';

<Main />
`;
};

const configPath = 'configure/app';
const getBaseDir = (lng: Language) => {
  const cwd = process.cwd();
  const baseDir = path.join(cwd, 'docs', lng, configPath);

  return baseDir;
};

export const gen = (jsonMap: Record<Language, Summary[]>) => {
  Object.keys(jsonMap).forEach(lng => {
    const baseDir = getBaseDir(lng as Language);
    const json = jsonMap[lng as Language];
    json.forEach(summary => {
      const mdDir = path.join(baseDir, summary.dirname);
      const mdPath = path.join(mdDir, `${hyphenate(summary.name)}.mdx`);
      if (!fs.existsSync(mdDir)) {
        fs.mkdirpSync(mdDir);
      }
      fs.writeFileSync(mdPath, createMarkdown(summary, lng as Language));
    });
  });
};

export const diff = (jsonMap: Record<Language, Summary[]>) => {
  const outdatedURI: string[] = [];
  Object.keys(jsonMap).forEach(lng => {
    const json = jsonMap[lng as Language];
    const old: {
      name: string;
      dirname: string;
    }[] = require(`./summary.${lng}.json`);

    const outdated = old.filter(oldSummary => {
      return !json.find(summary => {
        return (
          summary.dirname === oldSummary.dirname &&
          summary.name === oldSummary.name
        );
      });
    });

    const URIAry = outdated.map(summary => {
      const baseDir = getBaseDir(lng as Language);
      const mdDir = path.join(baseDir, summary.dirname);
      const mdPath = path.join(mdDir, `${hyphenate(summary.name)}.md`);
      return mdPath;
    });
    outdatedURI.push(...URIAry);
  });
  return outdatedURI;
};
