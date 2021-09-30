import path from 'path';
import os from 'os';
import execa from 'execa';
import { GeneratorContext } from '@modern-js/codesmith';
import { fs, getMonorepoPackages } from '@modern-js/utils';
import { canUseNpm, canUsePnpm, canUseYarn } from './utils/env';
import { stripAnsi } from './utils/strip-ansi';
import { i18n, localeKeys } from './locale';

export * from './utils';

export { fs } from '@modern-js/utils';

export { i18n } from './locale';

export async function getPackageVersion(
  packageName: string,
  registry?: string,
) {
  if (await canUsePnpm()) {
    const args = ['info', packageName, 'version'];
    if (registry) {
      args.push(`--registry=${registry}`);
    }
    const result = await execa('pnpm', args);
    return stripAnsi(result.stdout);
  }
  if (await canUseYarn()) {
    const args = ['info', packageName, 'version', '--silent'];
    if (registry) {
      args.push(`--registry=${registry}`);
    }
    const result = await execa('yarn', args);
    return stripAnsi(result.stdout);
  }
  if (await canUseNpm()) {
    const args = ['view', packageName, 'version'];
    if (registry) {
      args.push(`--registry=${registry}`);
    }
    const result = await execa('npm', args);
    return stripAnsi(result.stdout);
  }
  throw new Error('not found npm, please install npm before');
}

export function getPackageManager(cwd: string = process.cwd()) {
  let appDirectory = cwd;
  while (os.homedir() !== appDirectory) {
    if (fs.existsSync(path.resolve(appDirectory, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.resolve(appDirectory, 'yarn.lock'))) {
      return 'yarn';
    }
    if (fs.existsSync(path.resolve(appDirectory, 'package-lock.json'))) {
      return 'npm';
    }
    appDirectory = path.join(appDirectory, '..');
  }
  return 'npm';
}

export function isTsProject(appDir: string) {
  return fs.existsSync(path.join(appDir, 'tsconfig.json'));
}

export async function getPackageObj(context: GeneratorContext) {
  const pkgStr = (await context.materials.default.get(`package.json`).value())
    .content;

  return JSON.parse(pkgStr as string);
}

export function getAllPackages(appDir: string) {
  const packages = getMonorepoPackages(appDir);
  return packages.map(pkg => pkg.name);
}

export function validatePackageName(
  value: string,
  packages: string[],
  options: { isMonorepoSubProject: boolean },
) {
  const { isMonorepoSubProject } = options;
  if (isMonorepoSubProject && packages.includes(value)) {
    return {
      success: false,
      error: i18n.t(localeKeys.packageName.exit, { value }),
    };
  }
  return { success: true };
}

export function validatePackagePath(
  value: string,
  projectDir: string,
  options?: { isMwa?: boolean; isPublic?: boolean; isTest?: boolean },
) {
  const { isMwa, isPublic, isTest } = options || {};
  let dir = 'apps';
  if (isMwa && isTest) {
    dir = 'examples';
  } else {
    dir = isPublic ? 'packages' : 'features';
  }
  const packageDir = path.resolve(projectDir || '', dir, value);
  if (fs.existsSync(packageDir)) {
    return {
      success: false,
      error: i18n.t(localeKeys.pacakgePath.exit, { value }),
    };
  }
  return { success: true };
}

export function getModuleProjectPath(
  packagePath: string,
  isMonorepoSubProject: boolean,
  isPublic: boolean,
  isLocalPackages: boolean,
) {
  if (isLocalPackages && packagePath) {
    return `${packagePath}/`;
  }
  if (isMonorepoSubProject && packagePath) {
    return `${isPublic ? 'packages' : 'features'}/${packagePath}/`;
  }

  return '';
}

export function getMWAProjectPath(
  packagePath: string,
  isMonorepoSubProject: boolean,
  isTest = false,
) {
  if (isMonorepoSubProject && packagePath) {
    return `${isTest ? 'examples' : 'apps'}/${packagePath}/`;
  }
  return '';
}
