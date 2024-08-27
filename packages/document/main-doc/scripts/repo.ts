import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import execa from 'execa';

async function cloneRepo(
  dir: string,
  gitUrl: string,
  repo: string,
  branch = 'main',
) {
  const repoPath = path.join(dir, repo);
  await fs.remove(repoPath);
  await fs.ensureDir(dir);
  await execa(
    'git',
    ['clone', '-b', branch, '--single-branch', gitUrl, '--progress'],
    {
      cwd: dir,
    },
  );

  return repoPath;
}

export async function cloneRsbuildRepo() {
  const tmpDir = os.tmpdir();
  const repoDir = await cloneRepo(
    path.join(tmpDir, 'repo'),
    'https://github.com/web-infra-dev/rsbuild.git',
    'rsbuild',
    'main',
  );
  return repoDir;
}
