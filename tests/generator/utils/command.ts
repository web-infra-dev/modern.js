import path from 'path';
import { fs } from '@modern-js/utils';
import { execaWithStreamLog } from './tools';

export async function runCreteCommand(
  repoDir: string,
  isLocal: boolean,
  options: {
    projectName: string;
    config: Record<string, any>;
    cwd: string;
    platform?: boolean;
    plugin?: string;
  },
) {
  const { projectName, config, cwd, platform, plugin } = options;
  const debug =
    process.env.DEBUG === 'true' || process.env.CUSTOM_DEBUG === 'true';
  const packages = process.env.PACKAGES;
  const distTag = process.env.CUSTOM_DIST_TAG || 'next';
  if (isLocal) {
    return execaWithStreamLog(
      'node',
      [
        path.join(repoDir, 'packages', 'toolkit', 'create', 'bin', 'run.js'),
        projectName,
        '--config',
        JSON.stringify({
          packageName: projectName,
          ...config,
        }),
        '--dist-tag',
        distTag,
        debug ? '--debug' : '',
        platform ? '--platform' : '',
        plugin ? '--plugin' : '',
        plugin || '',
        packages ? '--packages' : '',
        packages || '',
      ],
      {
        cwd,
        env: {
          NoNeedInstall: 'true',
          CODESMITH_ENV: 'development',
        },
      },
    );
  }
  return execaWithStreamLog(
    'npx',
    [
      '@modern-js/create@next',
      projectName,
      '--dist-tag',
      distTag,
      '--config',
      JSON.stringify({
        packageName: projectName,
        ...config,
      }),
      debug ? '--debug' : '',
      platform ? '--platform' : '',
      plugin ? '--plugin' : '',
      plugin || '',
      packages ? '--packages' : '',
      packages || '',
    ],
    {
      cwd,
      env: {
        NoNeedInstall: 'true',
      },
    },
  );
}

export async function runInstallAndBuildProject(type: string, tmpDir: string) {
  const projects = fs.readdirSync(tmpDir);
  await Promise.all(
    projects
      .filter(project => project.includes(type))
      .map(async project => {
        console.info('install and build process', project);
        await execaWithStreamLog(
          'pnpm',
          ['install', '--ignore-scripts', '--force', '--shamefully-hoist'],
          {
            cwd: path.join(tmpDir, project),
          },
        );
        if (project.includes('monorepo')) {
          return Promise.resolve();
        }
        await execaWithStreamLog('pnpm', ['run', 'build'], {
          cwd: path.join(tmpDir, project),
        });
        return Promise.resolve();
      }),
  );
}

export async function runLintProject(type: string, tmpDir: string) {
  const projects = fs.readdirSync(tmpDir);
  await Promise.all(
    projects
      .filter(
        project => project.includes(type) && !project.includes('monorepo'),
      )
      .map(async project => {
        console.info('lint process', project);
        await execaWithStreamLog('pnpm', ['run', 'lint'], {
          cwd: path.join(tmpDir, project),
        });
        return Promise.resolve();
      }),
  );
}
