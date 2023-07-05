import path from 'path';
import { getModuleCases, getModuleNewCases } from '@modern-js/generator-cases';
import { fs, nanoid, semver } from '@modern-js/utils';
import { ModuleNewAction } from '@modern-js/new-action';
import { prepare } from './utils/prepare';
import {
  execaWithStreamLog,
  getPackageManager,
  usingTempDir,
} from './utils/tools';
import {
  runLintProject,
  runCreteCommand,
  runInstallAndBuildProject,
} from './utils/command';

async function createAllModuleProject(
  repoDir: string,
  tmpDir: string,
  isLocal: boolean,
  isSimple: boolean,
) {
  const cases: any = getModuleCases(isSimple ? 2 : undefined);
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
      pkgJSON.modernConfig = {
        autoLoadPlugins: true,
      };
      fs.writeJSONSync(path.join(cwd, projectName, 'package.json'), pkgJSON, {
        spaces: 2,
      });
    });
  }
}

async function runNewInModuleProject(
  repoDir: string,
  tmpDir: string,
  isLocal: boolean,
  isSimple: boolean,
) {
  const projects = fs.readdirSync(tmpDir);
  const project = projects.find(p => p.includes('module'));
  console.info('new process', project, repoDir, isLocal, isSimple);
  if (!project) {
    return;
  }
  await execaWithStreamLog('git', ['add', '.'], {
    cwd: path.join(tmpDir, project),
  });
  await execaWithStreamLog(
    'git',
    ['commit', '-m', 'feat: install info', '-n'],
    {
      cwd: path.join(tmpDir, project),
    },
  );
  const packageManager = getPackageManager(project);
  const cases = getModuleNewCases();
  for (const config of cases) {
    await runModuleNewCommand(isLocal, project, {
      cwd: path.join(tmpDir, project),
      config: JSON.stringify({
        noNeedInstall: true,
        ...config,
      }),
    });
    await execaWithStreamLog(packageManager, ['run', 'build'], {
      cwd: path.join(tmpDir, project),
    });
    await execaWithStreamLog(packageManager, ['run', 'lint'], {
      cwd: path.join(tmpDir, project),
    });
  }
}

async function runModuleNewCommand(
  isLocal: boolean,
  project: string,
  options: {
    config: string;
    cwd: string;
  },
) {
  const { config, cwd } = options;
  const debug =
    process.env.DEBUG === 'true' || process.env.CUSTOM_DEBUG === 'true';
  if (isLocal) {
    console.info('runModuleNewCommand', cwd, config);
    await ModuleNewAction({
      distTag: 'next',
      locale: 'zh',
      debug,
      config,
      cwd,
    });
  } else {
    await execaWithStreamLog(
      'npm',
      [
        'run',
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
  const isNode16 = semver.gte(process.versions.node, '16.0.0');
  const params = ['install', '--ignore-scripts', '--force'];
  // const packageManager = getPackageManager(project);
  const packageManager = 'pnpm'; // use pnpm package manager
  if (isNode16 || project.includes('pnpm')) {
    // if (packageManager === 'yarn') {
    //   params.push('--cache-folder');
    //   params.push(path.join(os.tmpdir(), project, 'yarn-cache'));
    // }
    await execaWithStreamLog(packageManager, params, {
      cwd,
    });
  } else {
    params.push('--shamefully-hoist');
    await execaWithStreamLog(packageManager, params, {
      cwd,
    });
  }
}

async function main() {
  try {
    console.info('run test module');
    const { isSimple, isLocal, repoDir, tmpDir } = await prepare('module');
    await createAllModuleProject(repoDir, tmpDir, isLocal, isSimple);
    await runInstallAndBuildProject('module', tmpDir);
    await runLintProject('module', tmpDir);
    await runNewInModuleProject(repoDir, tmpDir, isLocal, isSimple);
  } catch (e) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

main();
