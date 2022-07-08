import path from 'path';
import resolveFrom from 'resolve-from';
import { fs, execa } from '@modern-js/utils';
import readChangesets from '@changesets/read';

export interface Commit {
  id: string;
  type: 'feature' | 'fix';
  repository?: string;
  pullRequestId?: string;
  author?: string;
  message: string; // commit message
  summary: string; // changeset summary
  [key: string]: string | undefined;
}

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
      getReleaseNoteLine?: (commit: Commit) => string | Promise<string>;
    }
  | undefined;

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

function formatSummary(summary: string, pullRequestId?: string) {
  const [firstLine, ...futureLines] = summary
    .split('\n')
    .map(l => l.trimRight());

  let returnVal = firstLine;

  if (futureLines.length > 0) {
    if (pullRequestId) {
      returnVal = `\n\n  ${returnVal}`;
    } else {
      returnVal = `\n  ${returnVal}`;
    }
    returnVal += `\n\n  ${futureLines
      .filter(l => Boolean(l))
      .map(l => l)
      .join('\n\n')}`;
  }
  return returnVal;
}

export function getReleaseNoteLine(
  commit: Commit,
  customReleaseNoteFunction?: CustomReleaseNoteFunction,
) {
  if (customReleaseNoteFunction?.getReleaseNoteLine) {
    return customReleaseNoteFunction.getReleaseNoteLine(commit);
  }

  const { repository, pullRequestId, summary } = commit;
  if (pullRequestId && repository) {
    return `- [#${pullRequestId}](https://github.com/${repository}/pull/${pullRequestId}) ${formatSummary(
      summary,
      pullRequestId,
    )}\n`;
  }
  if (pullRequestId) {
    return `#${pullRequestId} ${formatSummary(summary, pullRequestId)}\n`;
  }
  return `${formatSummary(summary, pullRequestId)}\n`;
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
      throw new Error('Could not resolve relesae note generation functions');
    }
  }

  const changesets = await readChangesets(cwd);

  if (changesets.length === 0) {
    console.warn('No unreleased changesets found.');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  const features: Commit[] = [];
  const bugFix: Commit[] = [];

  for (const changeset of changesets) {
    const { stdout } = await execa('git', [
      'log',
      '--pretty=format:%h--%s--%an',
      `.changeset/${changeset.id}.md`,
    ]);
    const [id, message] = stdout.split('--');
    let commitObj: Commit = {
      id,
      type: (message || changeset.summary).startsWith('fix')
        ? 'fix'
        : 'feature',
      repository,
      message: (message || changeset.summary).trim(),
      summary: changeset.summary,
    };

    if (customReleaseNoteFunction?.getReleaseInfo) {
      commitObj = await customReleaseNoteFunction.getReleaseInfo(
        stdout,
        commitObj,
      );
    } else {
      commitObj = getReleaseInfo(stdout, commitObj);
    }

    if (commitObj.type === 'fix') {
      bugFix.push(commitObj);
    } else {
      features.push(commitObj);
    }
  }

  if (!features.length && !bugFix.length) {
    console.warn(
      'no release note found, you can run `pnpm run add` to add changeset',
    );
  }

  if (features.length) {
    console.info('## Features:\n');
    for (const commit of features) {
      const releaseNote = await getReleaseNoteLine(
        commit,
        customReleaseNoteFunction,
      );
      console.info(releaseNote);
    }
  }

  if (bugFix.length) {
    console.info('## Bug Fix:\n');
    for (const commit of bugFix) {
      const relesaeNote = await getReleaseNoteLine(
        commit,
        customReleaseNoteFunction,
      );
      console.info(relesaeNote);
    }
  }
}
