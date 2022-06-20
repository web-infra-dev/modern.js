import path from 'path';
import { fs, execa } from '@modern-js/utils';

interface Commit {
  id: string;
  pullRequestId: string;
  author: string;
  message: string;
}

interface ReleaseNoteOptions {
  since: string;
  repo: string;
}

export async function genReleaseNote(options: ReleaseNoteOptions) {
  const cwd = process.cwd();
  // eslint-disable-next-line prefer-const
  let { since, repo } = options;

  let config;
  try {
    config = await fs.readJSON(path.join(cwd, '.changeset', 'config.json'));
  } catch (e) {
    console.warn('not exit changeset config.json file');
  }

  if (!since) {
    since = config.baseBranch || 'main';
  }

  let repository: string = repo;

  if (!repo) {
    const pkg = await fs.readJSON(path.join(cwd, 'package.json'));
    // eslint-disable-next-line prefer-destructuring
    repository = pkg.repository;
  }

  if (!repository) {
    console.error(
      'not exit repository info, please use --repo option in command or add repository key in package.json',
    );
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  const { stdout } = await execa('git', [
    'log',
    '--pretty=format:%h--%s--%an',
    `${since}..HEAD`,
    '.',
  ]);

  const commitRegex = /(.*)\(#(\d*)\)/;

  let commits = stdout.split('\n');

  const features: Commit[] = [];
  const bugFix: Commit[] = [];

  // filter not container pull request id commit
  commits = commits.filter(commit => commit.match(commitRegex));
  commits.forEach(commit => {
    const [id, message, author] = commit.split('--');
    const [, messageShort, pullRequestId] = message.match(commitRegex)!;
    const commitObj = {
      id,
      pullRequestId,
      message: messageShort.trim(),
      author,
    };

    if (message.startsWith('fix')) {
      bugFix.push(commitObj);
    } else {
      features.push(commitObj);
    }
  });

  if (!features.length && !bugFix.length) {
    console.warn(
      'no release note found, you can run `pnpm run add` to add changeset',
    );
  }

  if (features.length) {
    console.info('Features:\n');
    features.forEach(feature => {
      console.info(
        `[[#${feature.pullRequestId}](https://github.com/${repository}/pull/${feature.pullRequestId})] ${feature.message} -- ${feature.author}\n`,
      );
    });
  }

  if (bugFix.length) {
    console.info('Bug Fix:\n');

    bugFix.forEach(bug => {
      console.info(
        `[[#${bug.pullRequestId}](https://github.com/${repository}/pull/${bug.pullRequestId})] ${bug.message} -- ${bug.author}\n`,
      );
    });
  }
}
