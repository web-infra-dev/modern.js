import path from 'path';
import readChangesets from '@changesets/read';
import { execa } from '@modern-js/utils';
import axios from 'axios';

// Commit 类型和相关常量
const CommitTypeTitle: Record<string, string> = {
  performance: 'Performance Improvements ⚡',
  features: 'New Features 🎉',
  bugFix: 'Bug Fixes 🐞',
  doc: 'Docs update 📄',
  other: 'Other Changes',
};
const CommitTypeZhTitle: Record<string, string> = {
  performance: '性能优化 ⚡',
  features: '新特性 🎉',
  bugFix: 'Bug 修复 🐞',
  doc: '文档更新 📄',
  other: '其他变更',
};
const ChangesTitle = `What's Changed`;
const ChangesZhTitle = '更新内容';

type CommitType = 'performance' | 'features' | 'bugFix' | 'doc' | 'other';
interface CommitObj {
  id: string;
  type: CommitType;
  repository?: string;
  pullRequestId?: string;
  author?: string;
  message: string;
  summary: string;
  summary_zh: string;
}

const AuthorMap = new Map();

function getCommitType(message: string): CommitType {
  if (message.startsWith('perf')) return 'performance';
  if (message.startsWith('feat')) return 'features';
  if (message.startsWith('fix') || message.startsWith('hotfix'))
    return 'bugFix';
  if (message.startsWith('docs')) return 'doc';
  return 'other';
}

async function getReleaseInfo(commit: string, commitObj: CommitObj) {
  const commitRegex = /(.*)\(#(\d*)\)/;
  const [commitId, message, email] = commit.split('--');
  const author = AuthorMap.get(email);
  if (author) {
    commitObj.author = author;
  } else if (process.env.GITHUB_AUTH_TOKEN) {
    try {
      const res = await axios.get(
        `https://api.github.com/repos/web-infra-dev/modern.js/commits/${commitId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GITHUB_AUTH_TOKEN}`,
          },
        },
      );
      const author = res.data.author.login;
      commitObj.author = author;
      AuthorMap.set(email, author);
    } catch (e) {
      console.warn(e);
    }
  }
  if ((message || commitObj.summary).match(commitRegex)) {
    const [, messageShort, pullRequestId] = (
      message || commitObj.summary
    ).match(commitRegex)!;
    commitObj.pullRequestId = pullRequestId;
    commitObj.message = messageShort.trim();
  }
  return commitObj;
}

function getReleaseNoteLine(commit: CommitObj, lang: 'en' | 'zh' = 'en') {
  const { repository, pullRequestId, summary, summary_zh, author } = commit;
  const pullRequest =
    pullRequestId && repository
      ? `https://github.com/${repository}/pull/${pullRequestId}`
      : '';
  if (lang === 'en') {
    return `- ${summary}${author ? ` by @${author}` : ''}${pullRequest ? ` in ${pullRequest}` : ''}\n`;
  }
  return `- ${summary_zh}${author ? ` 由 @${author} 实现` : ''}${pullRequest ? `， 详情可查看 ${pullRequest}` : ''}\n`;
}

async function genReleaseNote() {
  const cwd = process.cwd();
  const repoDir = path.join(cwd, '../../');
  const changesets = await readChangesets(repoDir, process.env.BASE_BRANCH);
  if (changesets.length === 0) {
    console.warn('No unreleased changesets found.');
    return '';
  }
  const releaseNote: Record<CommitType, { en: CommitObj[]; zh: CommitObj[] }> =
    {
      performance: { en: [], zh: [] },
      features: { en: [], zh: [] },
      bugFix: { en: [], zh: [] },
      doc: { en: [], zh: [] },
      other: { en: [], zh: [] },
    };
  for (const changeset of changesets) {
    const { stdout } = await execa(
      'git',
      ['log', '--pretty=format:%h--%s--%ae', `.changeset/${changeset.id}.md`],
      {
        cwd: repoDir,
      },
    );
    const [id, message] = stdout.split('--');
    const [firstLine, ...futureLines] = changeset.summary
      .split('\n')
      .map(l => l.trimRight());
    let commitObj: CommitObj = {
      id,
      type: getCommitType(changeset.summary || message),
      repository: 'web-infra-dev/modern.js',
      message: (message || changeset.summary).trim(),
      summary: firstLine,
      summary_zh: futureLines.filter(l => Boolean(l)).join('\n'),
    };
    commitObj = await getReleaseInfo(stdout, commitObj);
    releaseNote[commitObj.type].en.push(commitObj);
    if (commitObj.summary_zh) {
      releaseNote[commitObj.type].zh.push(commitObj);
    }
  }
  const result = {
    en: `## ${ChangesTitle}\n\n`,
    zh: `## ${ChangesZhTitle}\n\n`,
  };
  let flag = 0;
  for (const type of Object.keys(releaseNote) as CommitType[]) {
    const { en, zh } = releaseNote[type];
    if (en.length > 0) {
      result.en += `### ${CommitTypeTitle[type]}\n\n`;
      for (const commit of en) {
        const releaseNoteLine = getReleaseNoteLine(commit, 'en');
        result.en += releaseNoteLine;
      }
    }
    if (zh.length > 0) {
      flag = 1;
      result.zh += `### ${CommitTypeZhTitle[type]}\n\n`;
      for (const commit of zh) {
        const releaseNoteLine = getReleaseNoteLine(commit, 'zh');
        result.zh += releaseNoteLine;
      }
    }
  }
  const resultStr = flag ? `${result.en}\n\n${result.zh}` : result.en;
  console.info(resultStr);
  return resultStr;
}

async function run() {
  await genReleaseNote();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
