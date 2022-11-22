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
      '@modern-js/create',
      projectName,
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
  for (const project of projects) {
    if (!project.includes(type)) {
      continue;
    }
    console.info('install and build process', project);
    const packageManager = project.includes('pnpm') ? 'pnpm' : 'yarn';
    await execaWithStreamLog(packageManager, ['install', '--ignore-scripts'], {
      cwd: path.join(tmpDir, project),
    });
    if (project.includes('monorepo')) {
      continue;
    }
    await execaWithStreamLog(packageManager, ['build'], {
      cwd: path.join(tmpDir, project),
    });
  }
}

export async function runLintProject(type: string, tmpDir: string) {
  const projects = fs.readdirSync(tmpDir);
  for (const project of projects) {
    if (!project.includes(type)) {
      continue;
    }
    console.info('lint process', project);
    const packageManager = project.includes('pnpm') ? 'pnpm' : 'yarn';
    if (project.includes('monorepo')) {
      continue;
    }
    await execaWithStreamLog(packageManager, ['lint'], {
      cwd: path.join(tmpDir, project),
    });
  }
}

export async function runTestProject(tmpDir: string) {
  const projects = fs.readdirSync(tmpDir);
  for (const project of projects) {
    console.info('test process', project);
    const packageManager = project.includes('pnpm') ? 'pnpm' : 'yarn';
    if (project.includes('monorepo')) {
      continue;
    }
    await execaWithStreamLog(packageManager, ['test'], {
      cwd: path.join(tmpDir, project),
    });
  }
}
