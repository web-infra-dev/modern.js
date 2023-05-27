import path from 'path';
import resolveFrom from 'resolve-from';
import { fs, execa } from '@modern-js/utils';
import readChangesets from '@changesets/read';

export enum CommitType {
  Performance = 'performance',
  Features = 'features',
  BugFix = 'bugFix',
  Doc = 'doc',
  Other = 'other',
}

export interface Commit {
  id: string;
  type: CommitType;
  repository?: string;
  pullRequestId?: string;
  author?: string;
  message: string; // commit message
  summary: string; // changeset en ssummary
  summary_zh: string; // changeset zh summary
  [key: string]: string | undefined;
}

export interface Changes {
  en: Commit[];
  zh: Commit[];
}

export type ReleaseNote = Record<CommitType, Changes>;

interface ReleaseNoteOptions {
  repo?: string;
  custom?: string;
}

export type CustomReleaseNoteFunction =
  | {
      getReleaseInfo?: (
        commit: string,
        commitObj: Commit,
      ) => Commit | Promise<Commit>;
      getReleaseNoteLine?: (
        commit: Commit,
        lang?: 'en' | 'zh',
      ) => string | Promise<string>;
    }
  | undefined;

export const ChangesTitle = `What's Changed`;
export const ChangesZhTitle = '更新内容';
export const CommitTypeTitle = {
  performance: 'Performance Improvements ⚡',
  features: 'New Features 🎉',
  bugFix: 'Bug Fixes 🐞',
  doc: 'Docs update 📄',
  other: 'Other Changes',
};

export const CommitTypeZhTitle = {
  performance: '性能优化 ⚡',
  features: '新特性 🎉',
  bugFix: 'Bug 修复 🐞',
  doc: '文档更新 📄',
  other: '其他变更',
};

export function getCommitType(message: string) {
  if (message.startsWith('perf')) {
    return CommitType.Performance;
  }
  if (message.startsWith('feat')) {
    return CommitType.Features;
  }
  if (message.startsWith('fix') || message.startsWith('hotfix')) {
    return CommitType.BugFix;
  }
  if (message.startsWith('docs')) {
    return CommitType.Doc;
  }
  return CommitType.Other;
}

export function getReleaseInfo(commit: string, commitObj: Commit) {
  const commitRegex = /(.*)\(#(\d*)\)/;

  const [, message, author] = commit.split('--');

  commitObj.author = author;

  if ((message || commitObj.summary).match(commitRegex)) {
    const [, messageShort, pullRequestId] = (
      message || commitObj.summary
    ).match(commitRegex)!;
    commitObj.pullRequestId = pullRequestId;
    commitObj.message = messageShort.trim();
  }

  return commitObj;
}

export function getReleaseNoteLine(
  commit: Commit,
  customReleaseNoteFunction?: CustomReleaseNoteFunction,
  lang: 'en' | 'zh' = 'en',
) {
  if (customReleaseNoteFunction?.getReleaseNoteLine) {
    return customReleaseNoteFunction.getReleaseNoteLine(commit, lang);
  }

  const { repository, pullRequestId, summary, summary_zh, author } = commit;
  const pullRequest =
    pullRequestId && repository
      ? `https://github.com/${repository}/pull/${pullRequestId}`
      : '';
  if (lang === 'en') {
    return `- ${summary}${author ? ` by @${author}` : ''}${
      pullRequest ? ` in ${pullRequest}` : ''
    }\n`;
  }
  return `- ${summary_zh}${author ? ` 由 @${author} 实现` : ''}${
    pullRequest ? `， 详情可查看 ${pullRequest}` : ''
  }\n`;
}

export async function genReleaseNote(options: ReleaseNoteOptions) {
  const cwd = process.cwd();

  const { repo, custom } = options;

  let repository: string | undefined = repo;
  let customReleaseNoteFunction: CustomReleaseNoteFunction;

  if (!repo) {
    const pkg = await fs.readJSON(path.join(cwd, 'package.json'));
    ({ repository } = pkg);
  }

  if (custom) {
    let possibleReleaseNoteFunc;
    const releasenotePath = resolveFrom(cwd, custom);
    possibleReleaseNoteFunc = require(releasenotePath);
    if (possibleReleaseNoteFunc.default) {
      possibleReleaseNoteFunc = possibleReleaseNoteFunc.default;
    }
    if (
      typeof possibleReleaseNoteFunc.getReleaseInfo === 'function' &&
      typeof possibleReleaseNoteFunc.getReleaseNoteLine === 'function'
    ) {
      customReleaseNoteFunction = possibleReleaseNoteFunc;
    } else {
      throw new Error('Could not resolve release note generation functions');
    }
  }

  const changesets = await readChangesets(cwd);

  if (changesets.length === 0) {
    console.warn('No unreleased changesets found.');

    return '';
  }

  const releaseNote: ReleaseNote = {
    [CommitType.Performance]: { en: [], zh: [] },
    [CommitType.Features]: { en: [], zh: [] },
    [CommitType.BugFix]: { en: [], zh: [] },
    [CommitType.Doc]: { en: [], zh: [] },
    [CommitType.Other]: { en: [], zh: [] },
  };

  for (const changeset of changesets) {
    const { stdout } = await execa('git', [
      'log',
      '--pretty=format:%h--%s--%an',
      `.changeset/${changeset.id}.md`,
    ]);
    const [id, message] = stdout.split('--');
    const [firstLine, ...futureLines] = changeset.summary
      .split('\n')
      .map(l => l.trimRight());
    let commitObj: Commit = {
      id,
      type: getCommitType(changeset.summary || message),
      repository,
      message: (message || changeset.summary).trim(),
      summary: firstLine,
      summary_zh: futureLines.filter(l => Boolean(l)).join('\n'),
    };

    if (customReleaseNoteFunction?.getReleaseInfo) {
      commitObj = await customReleaseNoteFunction.getReleaseInfo(
        stdout,
        commitObj,
      );
    } else {
      commitObj = getReleaseInfo(stdout, commitObj);
    }

    releaseNote[commitObj.type].en.push(commitObj);
    if (commitObj.summary_zh) {
      releaseNote[commitObj.type].zh.push(commitObj);
    }
  }

  const result: { en: string; zh: string } = {
    en: `## ${ChangesTitle}\n\n`,
    zh: `## ${ChangesZhTitle}\n\n`,
  };
  // Flag contains zh content.
  let flag = 0;
  for (const [type, { en, zh }] of Object.entries(releaseNote)) {
    if (en.length > 0) {
      result.en += `### ${CommitTypeTitle[type as CommitType]}\n\n`;
      for (const commit of en) {
        const releaseNote = await getReleaseNoteLine(
          commit,
          customReleaseNoteFunction,
          'en',
        );
        result.en += releaseNote;
      }
    }
    if (zh.length > 0) {
      flag = 1;
      result.zh += `### ${CommitTypeZhTitle[type as CommitType]}\n\n`;
      for (const commit of zh) {
        const releaseNote = await getReleaseNoteLine(
          commit,
          customReleaseNoteFunction,
          'zh',
        );
        result.zh += releaseNote;
      }
    }
  }

  const resultStr = flag ? `${result.en}\n\n${result.zh}` : result.en;
  console.info(resultStr);
  return resultStr;
}
