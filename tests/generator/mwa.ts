import path from 'path';
import { getMWACases, getMWANewCases } from '@modern-js/generator-cases';
import { fs, nanoid, semver } from '@modern-js/utils';
import { MWANewAction } from '@modern-js/new-action';
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

async function createAllMWAProject(
  repoDir: string,
  tmpDir: string,
  isLocal: boolean,
  isSimple: boolean,
) {
  const cases: any = getMWACases(isSimple ? 2 : undefined);
  for (const config of cases) {
    await usingTempDir(tmpDir, async cwd => {
      const projectName = `mwa-${Object.values(config).join('-')}-${nanoid()}`;
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
      pkgJSON.engines = {
        node: process.env.NODE_VERSION,
      };
      fs.writeJSONSync(path.join(cwd, projectName, 'package.json'), pkgJSON, {
        spaces: 2,
      });
    });
  }
}

async function runNewMWAProject(
  repoDir: string,
  tmpDir: string,
  isLocal: boolean,
  isSimple: boolean,
) {
  const projects = fs.readdirSync(tmpDir);
  const project = projects.find(p => p.includes('mwa'));
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
  const cases = getMWANewCases(isSimple ? 5 : undefined);
  let hasMicroFrontend = false;
  let hasSSG = false;
  for (const config of cases) {
    if (project.includes('js') && config.framework === 'nest') {
      continue;
    }
    // 微前端和 ssg 不支持同时开启
    if (
      config.actionType === 'function' &&
      config.function === 'micro_frontend'
    ) {
      if (hasSSG) {
        continue;
      }
      hasMicroFrontend = true;
    }
    if (config.actionType === 'function' && config.function === 'ssg') {
      if (hasMicroFrontend) {
        continue;
      }
      hasSSG = true;
      const pkgJSONPath = path.join(tmpDir, project, 'package.json');
      const pkgJSON = fs.readJSONSync(pkgJSONPath, 'utf-8');
      pkgJSON.modernConfig = { autoLoadPlugins: true, output: { ssg: true } };
      fs.writeJSONSync(pkgJSONPath, pkgJSON, { spaces: 2 });
    }
    if (
      config.actionType === 'element' &&
      config.element === 'server' &&
      !config.framework
    ) {
      console.error('config error', config);
      continue;
    }
    if (
      config.actionType === 'function' &&
      config.function === 'bff' &&
      !config.framework
    ) {
      console.error('config error', config);
      continue;
    }
    if (config.actionType === 'refactor') {
      continue;
    }
    await runMWANewCommand(isLocal, project, {
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

async function runMWANewCommand(
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
    console.info('runMWANewCommand', cwd, config);
    await MWANewAction({
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
    console.info('run test mwa');
    const { isSimple, isLocal, repoDir, tmpDir } = await prepare('mwa');
    await createAllMWAProject(repoDir, tmpDir, isLocal, isSimple);
    await runInstallAndBuildProject('mwa', tmpDir);
    await runLintProject('mwa', tmpDir);
    await runNewMWAProject(repoDir, tmpDir, isLocal, isSimple);
  } catch (e) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

main();
