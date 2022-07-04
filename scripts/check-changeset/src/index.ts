import path from 'path';
import readChangesets from '@changesets/read';

async function run() {
  const cwd = process.cwd();
  const title = process.env.PULL_REQUEST_TITLE;
  if (title?.includes('[SKIP CHANGESET]')) {
    return;
  }
  const changesets = await readChangesets(
    path.join(cwd, '../../'),
    process.env.BASE_BRANCH,
  );
  for (const changeset of changesets) {
    const { releases } = changeset;
    releases.forEach(release => {
      if (release.type === 'major') {
        throw Error(`packages ${release.name} not allow bump major version`);
      }
    });
  }
}

run().catch(e => {
  throw e;
});
