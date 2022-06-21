import path from 'path';
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
}

interface ReleaseNoteOptions {
  repo?: string;
  custom?: string;
}

export type CustomReleaseNoteFunction =
  | {
      getReleaseInfo?: (commit: string, commitObj: Commit) => Commit;
      getReleaseNoteLine?: (commit: Commit) => string;
    }
  | undefined;

export function getReleaseInfo(commit: string, commitObj: Commit) {
  const commitRegex = /(.*)\(#(\d*)\)/;

  const [, message, author] = commit.split('--');

  commitObj.author = author;

  if (message.match(commitRegex)) {
    const [, messageShort, pullRequestId] = message.match(commitRegex)!;
    commitObj.pullRequestId = pullRequestId;
    commitObj.message = messageShort.trim();
  }

  return commitObj;
}

export function getReleaseNoteLine(
  commit: Commit,
  customReleaseNoteFunction?: CustomReleaseNoteFunction,
) {
  if (customReleaseNoteFunction?.getReleaseNoteLine) {
    return customReleaseNoteFunction.getReleaseNoteLine(commit);
  }
  const { repository, pullRequestId, summary, author } = commit;
  if (pullRequestId && repository) {
    return `[[#${pullRequestId}](https://github.com/${repository}/pull/${pullRequestId})] ${summary}${
      author ? ` -- ${author}` : ''
    }\n`;
  } else if (pullRequestId) {
    return `[#${pullRequestId}] ${summary}${author ? ` -- ${author}` : ''}\n`;
  } else {
    return `${summary}${author ? ` -- ${author}` : ''}\n`;
  }
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
    customReleaseNoteFunction = require(custom);
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
      type: message.startsWith('fix') ? 'fix' : 'feature',
      repository,
      message: message.trim(),
      summary: changeset.summary,
    };

    if (customReleaseNoteFunction?.getReleaseInfo) {
      commitObj = customReleaseNoteFunction.getReleaseInfo(stdout, commitObj);
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
    console.info('Features:\n');
    features.forEach(commit =>
      console.info(getReleaseNoteLine(commit, customReleaseNoteFunction)),
    );
  }

  if (bugFix.length) {
    console.info('Bug Fix:\n');

    bugFix.forEach(commit =>
      console.info(getReleaseNoteLine(commit, customReleaseNoteFunction)),
    );
  }
}
