import fs from 'fs';
import path from 'path';
import readChangesets from '@changesets/read';
import { execa, semver } from '@modern-js/utils';
import axios from 'axios';

const REPO_OWNER = 'web-infra-dev';
const REPO_NAME = 'modern.js';
const REPO_FULL_NAME = `${REPO_OWNER}/${REPO_NAME}`;
const RSBUILD_REPO_OWNER = 'web-infra-dev';
const RSBUILD_REPO_NAME = 'rsbuild';
const APP_TOOLS_PACKAGE_NAME = '@modern-js/app-tools';
const RSBUILD_PACKAGE_NAME = '@rsbuild/core';
const APP_TOOLS_PACKAGE_PATH = 'packages/solutions/app-tools/package.json';

// Commit types
const CommitTypeTitle: Record<string, string> = {
  performance: 'Performance Improvements ⚡',
  features: 'New Features 🎉',
  bugFix: 'Bug Fixes 🐞',
  doc: 'Docs update 📄',
  dependencies: 'Rsbuild Update 📦',
  other: 'Other Changes ✨',
};

const CommitTypeZhTitle: Record<string, string> = {
  performance: '性能优化 ⚡',
  features: '新特性 🎉',
  bugFix: 'Bug 修复 🐞',
  doc: '文档更新 📄',
  dependencies: 'Rsbuild 更新 📦',
  other: '其他变更 ✨',
};

const ChangesTitle = `What's Changed`;
const ChangesZhTitle = '更新内容';

type CommitType =
  | 'performance'
  | 'features'
  | 'bugFix'
  | 'doc'
  | 'dependencies'
  | 'other';

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

/**
 * Get the current version of @modern-js/app-tools from package.json
 */
function getAppToolsVersion(repoDir: string): string | undefined {
  try {
    const packageJsonPath = path.join(repoDir, APP_TOOLS_PACKAGE_PATH);
    if (!fs.existsSync(packageJsonPath)) {
      return undefined;
    }
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8'),
    ) as { version?: string };
    return packageJson.version;
  } catch {
    return undefined;
  }
}

/**
 * Get the current @rsbuild/core version from app-tools package.json
 */
function getCurrentRsbuildVersion(repoDir: string): string | undefined {
  try {
    const packageJsonPath = path.join(repoDir, APP_TOOLS_PACKAGE_PATH);
    if (!fs.existsSync(packageJsonPath)) {
      return undefined;
    }
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8'),
    ) as {
      dependencies?: Record<string, string>;
    };
    const rsbuildVersion = packageJson.dependencies?.[RSBUILD_PACKAGE_NAME];
    // Remove version range prefixes like ^, ~
    return rsbuildVersion?.replace(/^[\^~]/, '');
  } catch {
    return undefined;
  }
}

/**
 * Get the @rsbuild/core version from published @modern-js/app-tools package
 */
async function getPublishedRsbuildVersion(
  packageVersion: string,
): Promise<string | undefined> {
  try {
    // Use npm view command to get the dependency version
    const { stdout } = await execa('npm', [
      'view',
      `${APP_TOOLS_PACKAGE_NAME}@${packageVersion}`,
      'dependencies.@rsbuild/core',
    ]);
    const version = stdout.trim();
    // Remove version range prefixes like ^, ~
    return version ? version.replace(/^[\^~]/, '') : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Compare two semver versions
 * Returns true if newVersion > oldVersion
 */
function isVersionUpgraded(oldVersion: string, newVersion: string): boolean {
  try {
    return semver.gt(newVersion, oldVersion);
  } catch {
    return false;
  }
}

/**
 * Get all versions between oldVersion (exclusive) and newVersion (inclusive)
 */
function getVersionsBetween(oldVersion: string, newVersion: string): string[] {
  const versions: string[] = [];

  try {
    // Start from the next patch version after oldVersion
    let currentVersion = semver.inc(oldVersion, 'patch');
    if (!currentVersion) {
      return [newVersion];
    }

    // Generate all versions up to and including newVersion
    while (currentVersion && semver.lte(currentVersion, newVersion)) {
      versions.push(currentVersion);
      const nextVersion: string | null = semver.inc(currentVersion, 'patch');
      if (!nextVersion || semver.gt(nextVersion, newVersion)) {
        break;
      }
      currentVersion = nextVersion;
    }

    // Ensure newVersion is included if it's not already in the list
    if (versions.length === 0 || versions[versions.length - 1] !== newVersion) {
      versions.push(newVersion);
    }

    return versions;
  } catch {
    return [newVersion];
  }
}

/**
 * Format rsbuild upgrade note
 */
function formatRsbuildUpgradeNote(
  oldVersion: string,
  newVersion: string,
  lang: 'en' | 'zh' = 'en',
): CommitObj {
  const versions = getVersionsBetween(oldVersion, newVersion);
  const releaseLinks = versions.map(version => {
    const releaseUrl = `https://github.com/${RSBUILD_REPO_OWNER}/${RSBUILD_REPO_NAME}/releases/tag/v${version}`;
    return `[v${version}](${releaseUrl})`;
  });

  let linksText: string;
  if (releaseLinks.length === 1) {
    linksText = releaseLinks[0];
  } else {
    const lastLink = releaseLinks[releaseLinks.length - 1];
    const otherLinks = releaseLinks.slice(0, -1);
    if (lang === 'en') {
      linksText = `${otherLinks.join(', ')}, and ${lastLink}`;
    } else {
      linksText = `${otherLinks.join('、')}和${lastLink}`;
    }
  }

  if (lang === 'en') {
    return {
      id: '',
      type: 'dependencies',
      message: `Upgrade ${RSBUILD_PACKAGE_NAME}`,
      summary: `Upgrade ${RSBUILD_PACKAGE_NAME} from v${oldVersion} to v${newVersion}. See ${linksText} for details.`,
      summary_zh: `升级 ${RSBUILD_PACKAGE_NAME} 从 v${oldVersion} 到 v${newVersion}，查看 ${linksText} 了解详情。`,
    };
  }
  return {
    id: '',
    type: 'dependencies',
    message: `升级 ${RSBUILD_PACKAGE_NAME}`,
    summary: `Upgrade ${RSBUILD_PACKAGE_NAME} from v${oldVersion} to v${newVersion}. See ${linksText} for details.`,
    summary_zh: `升级 ${RSBUILD_PACKAGE_NAME} 从 v${oldVersion} 到 v${newVersion}，查看 ${linksText} 了解详情。`,
  };
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
      dependencies: { en: [], zh: [] },
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

  // Check for rsbuild version upgrade
  try {
    const appToolsVersion = getAppToolsVersion(repoDir);
    if (appToolsVersion) {
      const publishedRsbuildVersion =
        await getPublishedRsbuildVersion(appToolsVersion);
      const currentRsbuildVersion = getCurrentRsbuildVersion(repoDir);

      if (
        publishedRsbuildVersion &&
        currentRsbuildVersion &&
        isVersionUpgraded(publishedRsbuildVersion, currentRsbuildVersion)
      ) {
        const upgradeNote = formatRsbuildUpgradeNote(
          publishedRsbuildVersion,
          currentRsbuildVersion,
          'en',
        );
        releaseNote.dependencies.en.push(upgradeNote);
        releaseNote.dependencies.zh.push(upgradeNote);
      }
    }
  } catch {
    // Silently ignore errors
  }

  const result = {
    en: `## ${ChangesTitle}\n\n`,
    zh: `## ${ChangesZhTitle}\n\n`,
  };

  let hasZh = false;

  // Define the order: dependencies should be last
  const typeOrder: CommitType[] = [
    'performance',
    'features',
    'bugFix',
    'doc',
    'other',
    'dependencies',
  ];

  for (const type of typeOrder) {
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
