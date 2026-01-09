import path from 'path';
import readChangesets from '@changesets/read';
import { execa } from '@modern-js/utils';
import axios from 'axios';

const REPO_OWNER = 'web-infra-dev';
const REPO_NAME = 'modern.js';
const REPO_FULL_NAME = `${REPO_OWNER}/${REPO_NAME}`;

// Commit types
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
  pullRequestId?: string;
  author?: string;
  message: string;
  summary: string;
  summary_zh: string;
}

// Cache author promises to avoid duplicate requests for the same email
const AuthorMap = new Map<string, string | Promise<string>>();

function getCommitType(message: string): CommitType {
  if (message.startsWith('perf')) return 'performance';
  if (message.startsWith('feat')) return 'features';
  if (message.startsWith('fix') || message.startsWith('hotfix'))
    return 'bugFix';
  if (message.startsWith('docs')) return 'doc';
  return 'other';
}

async function fetchAuthor(
  commitId: string,
  email: string,
): Promise<string | undefined> {
  if (AuthorMap.has(email)) {
    return AuthorMap.get(email);
  }

  if (!process.env.GITHUB_AUTH_TOKEN) {
    return undefined;
  }

  const fetchPromise = (async () => {
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${REPO_FULL_NAME}/commits/${commitId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GITHUB_AUTH_TOKEN}`,
          },
        },
      );
      return res.data.author.login as string;
    } catch (e) {
      console.warn(
        `Failed to fetch author for commit ${commitId}:`,
        e instanceof Error ? e.message : e,
      );
      return undefined;
    }
  })();

  AuthorMap.set(email, fetchPromise as Promise<string>);

  const result = await fetchPromise;
  if (result) {
    AuthorMap.set(email, result);
  }
  return result;
}

async function getReleaseInfo(
  commit: string,
  commitObj: CommitObj,
): Promise<CommitObj> {
  const commitRegex = /(.*)\(#(\d*)\)/;
  const [commitId, message, email] = commit.split('--');

  const author = await fetchAuthor(commitId, email);
  if (author) {
    commitObj.author = author;
  }

  const matchTarget = message || commitObj.summary;
  const match = matchTarget.match(commitRegex);

  if (match) {
    const [, messageShort, pullRequestId] = match;
    commitObj.pullRequestId = pullRequestId;
    commitObj.message = messageShort.trim();
  }

  return commitObj;
}

function getReleaseNoteLine(commit: CommitObj, lang: 'en' | 'zh' = 'en') {
  const { pullRequestId, summary, summary_zh, author } = commit;
  const pullRequest = pullRequestId
    ? `https://github.com/${REPO_FULL_NAME}/pull/${pullRequestId}`
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
    try {
      const { stdout } = await execa(
        'git',
        ['log', '--pretty=format:%h--%s--%ae', `.changeset/${changeset.id}.md`],
        { cwd: repoDir },
      );

      const [id, message] = stdout.split('--');
      const [firstLine, ...futureLines] = changeset.summary
        .split('\n')
        .map(l => l.trimRight());

      let commitObj: CommitObj = {
        id,
        type: getCommitType(changeset.summary || message),
        message: (message || changeset.summary).trim(),
        summary: firstLine,
        summary_zh: futureLines.filter(Boolean).join('\n'),
      };

      commitObj = await getReleaseInfo(stdout, commitObj);

      releaseNote[commitObj.type].en.push(commitObj);
      if (commitObj.summary_zh) {
        releaseNote[commitObj.type].zh.push(commitObj);
      }
    } catch (error) {
      console.error(`Failed to process changeset ${changeset.id}:`, error);
    }
  }

  const result = {
    en: `## ${ChangesTitle}\n\n`,
    zh: `## ${ChangesZhTitle}\n\n`,
  };

  let hasZh = false;

  for (const type of Object.keys(releaseNote) as CommitType[]) {
    const { en, zh } = releaseNote[type];

    if (en.length > 0) {
      result.en += `### ${CommitTypeTitle[type]}\n\n`;
      for (const commit of en) {
        result.en += getReleaseNoteLine(commit, 'en');
      }
    }

    if (zh.length > 0) {
      hasZh = true;
      result.zh += `### ${CommitTypeZhTitle[type]}\n\n`;
      for (const commit of zh) {
        result.zh += getReleaseNoteLine(commit, 'zh');
      }
    }
  }

  const resultStr = hasZh ? `${result.en}\n\n${result.zh}` : result.en;
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
