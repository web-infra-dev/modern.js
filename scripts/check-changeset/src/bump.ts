import { spawnSync } from 'child_process';
import path from 'path';
import { syncPeerDependencies } from './peerDependencies';

async function run() {
  const repoDir = path.resolve(process.cwd(), '../..');
  const args = process.argv.slice(2);
  const result = spawnSync(
    process.execPath,
    [require.resolve('@changesets/cli/bin.js'), 'version', ...args],
    { cwd: repoDir, stdio: 'inherit' },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  if (args.some(arg => arg === '--help' || arg.startsWith('--help='))) {
    return;
  }

  await syncPeerDependencies(repoDir);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
