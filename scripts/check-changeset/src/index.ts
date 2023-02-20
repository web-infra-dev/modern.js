import path from 'path';
import readChangesets from '@changesets/read';
import { getPackages } from '@manypkg/get-packages';

async function run() {
  const cwd = process.cwd();
  const title = process.env.PULL_REQUEST_TITLE;
  if (title?.includes('[SKIP CHANGESET]')) {
    return;
  }
  const repoDir = path.join(cwd, '../../');
  const { packages } = await getPackages(repoDir);
  const changesets = await readChangesets(repoDir, process.env.BASE_BRANCH);
  for (const changeset of changesets) {
    const { id, releases, summary } = changeset;
    releases.forEach(release => {
      if (release.type === 'major') {
        throw Error(
          `packages ${release.name} not allow bump major version in ${id}.md file`,
        );
      }
      if (!packages.find(pkg => pkg.packageJson.name === release.name)) {
        throw Error(`package ${release.name} is not found in ${id}.md file`);
      }
    });
    if (summary.split('\n').filter(v => v).length < 2) {
      throw Error(
        `Changeset '${id}' should container English and Chinese info`,
      );
    }
  }
}

run().catch(e => {
  console.error(e);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
