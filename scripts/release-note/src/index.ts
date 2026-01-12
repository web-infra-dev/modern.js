import path from 'path';
import readChangesets from '@changesets/read';
import { execa } from '@modern-js/utils';
import { getCommitType, getReleaseInfo, getReleaseNoteLine } from './changeset';
import {
  formatRsbuildUpgradeNote,
  getAppToolsVersion,
  getCurrentRsbuildVersion,
  getPublishedRsbuildVersion,
  isVersionUpgraded,
} from './rsbuild';
import type { CommitObj, CommitType } from './types';
import {
  ChangesTitle,
  ChangesZhTitle,
  CommitTypeTitle,
  CommitTypeZhTitle,
} from './types';

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
