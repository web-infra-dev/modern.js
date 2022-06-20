import path from 'path';
import { fs, execa } from '@modern-js/utils';
import readChangesets from '@changesets/read';

export interface Commit {
  id: string;
  repository?: string;
  pullRequestId?: string;
  author: string;
  message: string; // commit message
  summary: string; // changeset summary
}

interface ReleaseNoteOptions {
  repo?: string;
  custom?: string;
}

type CustomReleaseNoteFunction =
  | {
      getReleaseNoteLine: (commit: Commit) => string;
    }
  | undefined;

function renderCommitInfo(
  commit: Commit,
  customReleaseNoteFunction: CustomReleaseNoteFunction,
) {
  if (customReleaseNoteFunction?.getReleaseNoteLine) {
    const info = customReleaseNoteFunction.getReleaseNoteLine(commit);
    console.info(info);
    return;
  }
  const { repository, pullRequestId, summary, author } = commit;
  if (pullRequestId && repository) {
    console.info(
      `[[#${pullRequestId}](https://github.com/${repository}/pull/${pullRequestId})] ${summary} -- ${author}\n`,
    );
  } else if (pullRequestId) {
    console.info(`[#${pullRequestId}] ${summary} -- ${author}\n`);
  } else {
    console.info(`${summary} -- ${author}\n`);
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
  const commitRegex = /(.*)\(#(\d*)\)/;

  for (const changeset of changesets) {
    const { stdout } = await execa('git', [
      'log',
      '--pretty=format:%h--%s--%an',
      `.changeset/${changeset.id}.md`,
    ]);

    const [id, message, author] = stdout.split('--');
    const commitObj: Commit = {
      id,
      repository,
      message: message.trim(),
      summary: changeset.summary,
      author,
    };

    if (message.match(commitRegex)) {
      const [, messageShort, pullRequestId] = message.match(commitRegex)!;
      commitObj.pullRequestId = pullRequestId;
      commitObj.message = messageShort.trim();
    }

    if (message.startsWith('fix')) {
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
      renderCommitInfo(commit, customReleaseNoteFunction),
    );
  }

  if (bugFix.length) {
    console.info('Bug Fix:\n');

    bugFix.forEach(commit =>
      renderCommitInfo(commit, customReleaseNoteFunction),
    );
  }
}
