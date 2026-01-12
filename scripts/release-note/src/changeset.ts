import axios from 'axios';
import type { CommitObj, CommitType } from './types';
import { REPO_FULL_NAME } from './types';

const AuthorMap = new Map<string, string | Promise<string>>();

export function getCommitType(message: string): CommitType {
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

export async function getReleaseInfo(
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

export function getReleaseNoteLine(
  commit: CommitObj,
  lang: 'en' | 'zh' = 'en',
) {
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
