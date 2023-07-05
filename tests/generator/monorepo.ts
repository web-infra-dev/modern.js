import path from 'path';
import {
  getMonorepoCases,
  getMonorepoNewCases,
} from '@modern-js/generator-cases';
import { fs, nanoid } from '@modern-js/utils';
import { MonorepoNewAction } from '@modern-js/new-action';
import { prepare } from './utils/prepare';
import { execaWithStreamLog, usingTempDir } from './utils/tools';
import { runCreteCommand, runInstallAndBuildProject } from './utils/command';

async function createAllMonorepoProject(
  repoDir: string,
  tmpDir: string,
  isLocal: boolean,
) {
  const cases: any = getMonorepoCases();
  for (const config of cases) {
    await usingTempDir(tmpDir, async cwd => {
      const projectName = `module-${Object.values(config).join(
        '-',
      )}-${nanoid()}`;
      await runCreteCommand(repoDir, isLocal, {
        projectName,
        cwd,
        config,
      });
      const pkgJSON = fs.readJSONSync(
        path.join(cwd, projectName, 'package.json'),
      );
      pkgJSON.engines = {
        node: process.env.NODE_VERSION,
      };
      fs.writeJSONSync(path.join(cwd, projectName, 'package.json'), pkgJSON, {
        spaces: 2,
      });
    });
  }
}

async function runNewInMonorepoProject(
  repoDir: string,
  tmpDir: string,
  isLocal: boolean,
  isSimple: boolean,
) {
  const projects = fs.readdirSync(tmpDir);
  const project = projects.find(p => p.includes('monorepo'));
  console.info('process', project);
  if (!project) {
    return;
  }
  console.info('process', project);
  // const packageManager = project.includes('pnpm') ? 'pnpm' : 'npm';
  const packageManager = 'pnpm'; // use pnpm package manager
  const cases = getMonorepoNewCases(isSimple ? 5 : undefined);
  for (const config of cases) {
    const subProjectPath = path.join(
      tmpDir,
      project,
      config.solution === 'mwa' || config.solution === 'mwa_test'
        ? 'apps'
        : 'packages',
      config.packageName,
    );
    if (fs.existsSync(subProjectPath)) {
      continue;
    }
    await runMonorepoNewCommand(isLocal, packageManager, {
      cwd: path.join(tmpDir, project),
      config: JSON.stringify({ ...config, noNeedInstall: true }),
    });
    await execaWithStreamLog(
      packageManager,
      ['install', '--ignore-scripts', '--no-frozen-lockfile'],
      {
        cwd: path.join(tmpDir, project),
      },
    );
    await execaWithStreamLog(
      packageManager,
      ['run', 'build', '--filter', './apps'],
      {
        cwd: path.join(tmpDir, project),
      },
    );
    await execaWithStreamLog(
      packageManager,
      ['run', 'prepare', '--filter', './packages'],
      {
        cwd: path.join(tmpDir, project),
      },
    );
    await execaWithStreamLog(packageManager, ['lint'], {
      cwd: path.join(tmpDir, project),
    });
  }
}

async function runMonorepoNewCommand(
  isLocal: boolean,
  packageManager: 'pnpm' | 'npm',
  options: {
    config: string;
    cwd: string;
  },
) {
  const { config, cwd } = options;
  const debug =
    process.env.DEBUG === 'true' || process.env.CUSTOM_DEBUG === 'true';
  if (isLocal) {
    console.info('runMonorepoNewCommand', cwd, config);
    await MonorepoNewAction({
      distTag: 'next',
      locale: 'zh',
      debug: true,
      config,
      cwd,
    });
  } else {
    await execaWithStreamLog(
      'npm',
      [
        'new',
        '--',
        '--dist-tag',
        'next',
        '--config',
        config,
        debug ? '--debug' : '',
      ],
      {
        cwd,
        env: {
          NoNeedInstall: 'true',
        },
      },
    );
  }
}

async function main() {
  try {
    console.info('run test monorepo');
    const { isSimple, isLocal, repoDir, tmpDir } = await prepare('monorepo');
    await createAllMonorepoProject(repoDir, tmpDir, isLocal);
    await runInstallAndBuildProject('monorepo', tmpDir);
    await runNewInMonorepoProject(repoDir, tmpDir, isLocal, isSimple);
  } catch (e) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

main();
