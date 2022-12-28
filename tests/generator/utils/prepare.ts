import path from 'path';
import os from 'os';
import fs from '@modern-js/utils/fs-extra';
import { execaWithStreamLog } from './tools';

async function addNewActionDevDependence(repoCwd: string) {
  const actionPath = path.join(
    repoCwd,
    'packages/generator/new-action/package.json',
  );
  const pkgJSON = JSON.parse(await fs.readFile(actionPath, 'utf-8'));
  pkgJSON.devDependencies = {
    ...pkgJSON.devDependencies,
    '@modern-js/bff-generator': 'workspace:*',
    '@modern-js/dependence-generator': 'workspace:*',
    '@modern-js/entry-generator': 'workspace:*',
    '@modern-js/server-generator': 'workspace:*',
    '@modern-js/test-generator': 'workspace:*',
    '@modern-js/repo-generator': 'workspace:*',
    '@modern-js/tailwindcss-generator': 'workspace:*',
    '@modern-js/storybook-generator': 'workspace:*',
    '@modern-js/ssg-generator': 'workspace:*',
  };
  await fs.writeFile(
    actionPath,
    `${JSON.stringify(pkgJSON, null, '  ')}\n`,
    'utf-8',
  );
  await execaWithStreamLog(
    'pnpm install --ignore-scripts --no-frozen-lockfile',
    [],
    {
      shell: true,
      cwd: repoCwd,
    },
  );
}

export async function prepare(type: string) {
  const isLocal =
    process.env.LOCAL === 'true' || process.env.CUSTOM_LOCAL === 'true';
  const isSimple =
    process.env.SIMPLE === 'true' || process.env.CUSTOM_SIMPLE === 'true';
  const repoDir = path.resolve('../');
  if (isLocal) {
    process.env.CODESMITH_ENV = 'development';
    addNewActionDevDependence(repoDir);
  }
  const tmpDir = path.join(os.tmpdir(), 'modern-generators', type);
  await fs.remove(tmpDir);
  return { isSimple, isLocal, repoDir, tmpDir };
}
