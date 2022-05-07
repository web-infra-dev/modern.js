import * as path from 'path';
import {
  FileSystem,
  IPackageJson,
  JsonFile,
} from '@rushstack/node-core-library';
import { fs, yaml, execa, logger, chalk, signale } from '@modern-js/utils';
import { WORKSPACE_FILE } from '../../constants';
import { IPnpmWorkSpace } from '../../type';
import { DagOperator } from '../../dag/operator';
import { IProjectNode } from '../../projects/get-projects';
import { PackageManagerType } from '../../parse-config';

interface IDeployConfig {
  rootPath: string;
  packageManager: PackageManagerType;
  deployPath?: string;
}

const createCopyMap = (
  rootPath: string,
  targetProject: IProjectNode,
  copyProjects: IProjectNode[],
  deployDir: string,
) => {
  const map = new Map<string, string>();
  for (const project of copyProjects) {
    const relativePath = path.relative(rootPath, project.extra.path);
    const targetPath = path.join(deployDir, relativePath);
    map.set(project.extra.path, targetPath);
  }

  const targetProjectDeployPath = path.join(deployDir, 'apps/app');
  map.set(targetProject.extra.path, targetProjectDeployPath);

  return map;
};

const createCopyFromMonorepoToDeployDirFn =
  (monorepoDir: string, deployDir: string) => (filename: string) => {
    const sourcePath = path.join(monorepoDir, filename);
    const destinationPath = path.join(deployDir, filename);
    if (FileSystem.exists(sourcePath)) {
      FileSystem.copyFile({
        sourcePath,
        destinationPath,
      });
    }
  };

const checkAndUpdatePMWorkspaces = (deployDir: string) => {
  // pnpm-workspace
  const pnpmWp = path.join(deployDir, WORKSPACE_FILE.PNPM);
  if (fs.existsSync(pnpmWp)) {
    const pnpmWorkspace = yaml.load(
      fs.readFileSync(pnpmWp, 'utf-8'),
    ) as IPnpmWorkSpace;
    if (pnpmWorkspace.packages && Array.isArray(pnpmWorkspace.packages)) {
      pnpmWorkspace.packages.push('apps/**');
    }
    fs.writeFileSync(pnpmWp, yaml.dump(pnpmWorkspace));
  }

  const pkgPath = path.join(deployDir, WORKSPACE_FILE.YARN);
  const pkg = JsonFile.load(pkgPath);
  if (pkg.workspaces?.packages && Array.isArray(pkg.workspaces.packages)) {
    pkg.workspaces.packages.push('app/**');
  }
};

const generatorAndCopyRequiredFiles = (rootPath: string, deployDir: string) => {
  // copy .npmrc
  const copy = createCopyFromMonorepoToDeployDirFn(rootPath, deployDir);
  copy('.npmrc');
  copy('package.json');
  copy('pnpm-workspace.yaml');
  copy('.pnpmfile.cjs');
  copy('tsconfig.json');
  copy('modern.config.js'); // TODO: 暂时配置，要移除
  // lock file
  copy('pnpm-lock.yaml');
  copy('yarn.lock');
  copy('package-lock.json');

  // check workspaces config and add 'apps/**',
  // because we deploy project to 'apps' dir
  checkAndUpdatePMWorkspaces(deployDir);
};

const checkAndRunDeployCommand = async (
  monorepoPath: string,
  targetProject: IProjectNode,
  packageManager: PackageManagerType,
) => {
  const scripts =
    (targetProject.extra?.scripts as IPackageJson['scripts']) || {};
  if (scripts.deploy) {
    logger.info(
      `The 'deploy' command for the ${targetProject.name} is detected, so 'deploy' will be executed`,
    );
    let runDeployCommands = ['run', 'deploy'];
    if (packageManager === 'pnpm') {
      runDeployCommands = ['run', 'deploy', '--filter', targetProject.name];
    } else if (packageManager === 'yarn') {
      runDeployCommands = ['workspace', targetProject.name, 'run', 'deploy'];
    }
    const cwd =
      packageManager === 'npm' ? targetProject.extra.path : monorepoPath;
    const childProcess = execa(packageManager, runDeployCommands, {
      cwd,
      stdio: ['pipe'],
    });

    childProcess.stdout?.pipe(process.stdout);
    childProcess.stderr?.pipe(process.stderr);
    await childProcess;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const installDependency = async (
  deployDir: string,
  packageManager: PackageManagerType,
) => {
  // TODO: 使用公共方法替换
  const packageJsonPath = path.join(deployDir, 'package.json');
  const packageJson = JsonFile.load(packageJsonPath) as IPackageJson;
  const scripts = packageJson?.scripts || {};
  let commands = [];
  if (scripts.setup) {
    logger.info(
      `The 'setup' command is detected, execute '${packageManager} run setup' to start installing the dependencies`,
    );
    commands = ['run', 'setup'];
  } else {
    logger.info(
      `No 'setup' command detected, execute '${packageManager} install' to start installing dependencies`,
    );
    commands = ['install'];
  }

  logger.log(chalk.rgb(218, 152, 92)('Install Log:\n'));

  const childProcess = execa(packageManager, commands, {
    stdio: 'inherit',
    cwd: deployDir,
    env: { NODE_ENV: undefined },
  });

  await childProcess;
};

const excludeDirs = (filePath: string, dirs: string[]) =>
  dirs.some(dir => filePath.includes(dir));

const defaultDeployPath = 'output';

export const deploy = async (
  deployProjectNames: string[],
  operator: DagOperator,
  config: IDeployConfig,
) => {
  const { rootPath, packageManager, deployPath = defaultDeployPath } = config;
  const realDeployPath = path.isAbsolute(deployPath)
    ? deployPath
    : path.join(rootPath, deployPath);

  FileSystem.deleteFolder(realDeployPath); // 保证 realDeployPath 目录内为空

  for (const deployProjectName of deployProjectNames) {
    const currentProject = operator.getNodeData(deployProjectName, {
      checkExist: true,
    });
    const alldeps = operator.getNodeAllDependencyData(deployProjectName);
    const copyMap = createCopyMap(
      rootPath,
      currentProject,
      alldeps,
      realDeployPath,
    );

    await checkAndRunDeployCommand(rootPath, currentProject, packageManager);

    FileSystem.ensureFolder(realDeployPath);

    for (const [from, to] of copyMap) {
      // https://rushstack.io/pages/api/node-core-library.ifilesystemcopyfilesasyncoptions/
      FileSystem.copyFiles({
        sourcePath: from,
        destinationPath: to,
        // If true, then when copying symlinks, copy the target object instead of copying the link.
        dereferenceSymlinks: false,
        filter(filePath) {
          if (excludeDirs(filePath, ['node_modules', 'dist'])) {
            return false;
          }
          return true;
        },
      });
    }
  }

  generatorAndCopyRequiredFiles(rootPath, realDeployPath);
  // await installDependency(realDeployPath, packageManager);

  signale.success(`Deploy success. The deploy dir is in '${rootPath}/output'`);
};
