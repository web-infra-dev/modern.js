import path from 'path';
import readChangesets from '@changesets/read';
import { getPackages, Package } from '@manypkg/get-packages';

type VersionType = 'major' | 'minor' | 'patch' | 'none';
type Release = {
  name: string;
  type: VersionType;
};
type Changeset = {
  summary: string;
  releases: Array<Release>;
};
type NewChangeset = Changeset & {
  id: string;
};

function checkChangeset(packages: Package[], changesets: NewChangeset[]) {
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

function validatePackagePeerDependencies(packages: Package[]) {
  packages.forEach(({ packageJson }) => {
    const { peerDependencies = {} } = packageJson;
    Object.keys(peerDependencies).forEach(dep => {
      const depPkg = packages.find(pkg => pkg.packageJson.name === dep);
      if (depPkg) {
        if (
          peerDependencies[dep] !== `workspace:^${depPkg.packageJson.version}`
        ) {
          throw Error(
            `${packageJson.name}'s peerDependencies ${dep} version is not right, expect "workspace:^${depPkg.packageJson.version}"`,
          );
        }
      }
    });
  });
}
async function run() {
  const cwd = process.cwd();
  const title = process.env.PULL_REQUEST_TITLE;
  if (title?.includes('[SKIP CHANGESET]')) {
    return;
  }
  const repoDir = path.join(cwd, '../../');
  const { packages } = await getPackages(repoDir);
  const changesets = await readChangesets(repoDir, process.env.BASE_BRANCH);
  checkChangeset(packages, changesets);
  validatePackagePeerDependencies(packages);
}

run().catch(e => {
  console.error(e);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
