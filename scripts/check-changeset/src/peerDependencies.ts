import { writeFile } from 'fs/promises';
import path from 'path';
import { getPackages } from '@manypkg/get-packages';

export async function syncPeerDependencies(repoDir: string): Promise<void> {
  const { packages } = await getPackages(repoDir);
  const versions = new Map(
    packages.map(({ packageJson }) => [packageJson.name, packageJson.version]),
  );

  for (const { dir, packageJson } of packages) {
    const peers = packageJson.peerDependencies;
    if (!peers) {
      continue;
    }

    let changed = false;
    for (const name of Object.keys(peers)) {
      const version = versions.get(name);
      if (version === undefined) {
        continue;
      }

      const expectedRange = `workspace:^${version}`;
      if (peers[name] !== expectedRange) {
        peers[name] = expectedRange;
        changed = true;
      }
    }

    if (changed) {
      await writeFile(
        path.join(dir, 'package.json'),
        `${JSON.stringify(packageJson, null, 2)}\n`,
      );
    }
  }
}
