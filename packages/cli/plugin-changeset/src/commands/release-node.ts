import path from 'path';
import { fs, execa } from '@modern-js/utils';
import readChangesets from '@changesets/read';

interface Commit {
  id: string;
  repository?: string;
  pullRequestId?: string;
  author: string;
  message: string;
}

interface ReleaseNoteOptions {
  repo?: string;
}

function renderCommitInfo(commit: Commit) {
  const { repository, pullRequestId, message, author } = commit;
  if (pullRequestId && repository) {
    console.info(
      `[[#${pullRequestId}](https://github.com/${repository}/pull/${pullRequestId})] ${message} -- ${author}\n`,
    );
  } else if (pullRequestId) {
    console.info(`[#${pullRequestId}] ${message} -- ${author}\n`);
  } else {
    console.info(`${message} -- ${author}\n`);
  }
}

export async function genReleaseNote(options: ReleaseNoteOptions) {
  const cwd = process.cwd();

  const { repo } = options;

  let repository: string | undefined = repo;

  if (!repo) {
    const pkg = await fs.readJSON(path.join(cwd, 'package.json'));
    ({ repository } = pkg);
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
    const [, messageShort, pullRequestId] = message.match(commitRegex)!;
    const commitObj = {
      id,
      repository,
      pullRequestId,
      message: changeset.summary || messageShort.trim(),
      author,
    };

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
    features.forEach(renderCommitInfo);
  }

  if (bugFix.length) {
    console.info('Bug Fix:\n');

    bugFix.forEach(renderCommitInfo);
  }
}
