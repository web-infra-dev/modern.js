import path from 'path';
import { getPackageManager, isMonorepo, fs } from '@modern-js/utils';
import { tag as gitTag } from '@changesets/git';
import { CHANGESET_PATH, execaWithStreamLog, getPnpmVersion } from '../utils';

interface ReleaseOptions {
  tag: string;
  ignoreScripts: boolean;
  gitChecks: boolean;
  otp: string;
}

export async function release(options: ReleaseOptions) {
  const appDir = process.cwd();
  const packageManager = await getPackageManager(process.cwd());

  const params = ['publish'];

  const { tag, otp, ignoreScripts, gitChecks } = options;

  if (tag) {
    params.push('--tag');
    params.push(tag);
  }

  if (otp) {
    params.push('--otp');
    params.push(otp);
  }

  if (
    !isMonorepo(appDir) ||
    packageManager === 'yarn' ||
    packageManager === 'npm'
  ) {
    await execaWithStreamLog(process.execPath, [CHANGESET_PATH, ...params]);
    return;
  }

  params.push('-r');
  params.push('--filter');
  const pnpmVersion = await getPnpmVersion();
  if (pnpmVersion.startsWith('6')) {
    params.push('./packages/');
  } else {
    params.push('{./packages/**}');
  }
  params.push('--report-summary');

  if (ignoreScripts) {
    params.push('--ignore-scripts');
  }

  if (!gitChecks) {
    params.push('--no-git-checks');
  }

  await execaWithStreamLog(packageManager, params);

  const pnpmPublishSummaryFile = path.join(appDir, 'pnpm-publish-summary.json');
  const publishInfo: {
    publishedPackages: Array<{ name: string; version: string }>;
  } = await fs.readJSON(pnpmPublishSummaryFile, 'utf-8');

  await Promise.all(
    (publishInfo.publishedPackages || []).map(pkg =>
      gitTag(`${pkg.name}@${pkg.version}`, appDir),
    ),
  );

  await fs.remove(pnpmPublishSummaryFile);
}
