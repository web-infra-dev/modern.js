import path from 'path';
import { fs, semver } from '@modern-js/utils';
import { execaWithStreamLog, getPackageManager } from './tools';

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
  const packageManager = getPackageManager(projectName);
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
          packageManager,
        }),
        '--dist-tag',
        'next',
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
      'next',
      '--config',
      JSON.stringify({
        packageName: projectName,
        ...config,
        packageManager,
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
        // const packageManager = getPackageManager(project);
        const packageManager = 'pnpm';
        const isNode16 = semver.gte(process.versions.node, '16.0.0');
        const params = ['install', '--ignore-scripts', '--force'];
        if (isNode16 || project.includes('pnpm')) {
          // if (packageManager === 'yarn') {
          //   params.push('--cache-folder');
          //   params.push(path.join(os.tmpdir(), project, 'yarn-cache'));
          // }
          await execaWithStreamLog(packageManager, params, {
            cwd: path.join(tmpDir, project),
          });
        } else {
          params.push('--shamefully-hoist');
          await execaWithStreamLog(packageManager, params, {
            cwd: path.join(tmpDir, project),
          });
        }
        if (project.includes('monorepo')) {
          return Promise.resolve();
        }
        await execaWithStreamLog(packageManager, ['run', 'build'], {
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
        const packageManager = getPackageManager(project);
        await execaWithStreamLog(packageManager, ['run', 'lint'], {
          cwd: path.join(tmpDir, project),
        });
        return Promise.resolve();
      }),
  );
}
