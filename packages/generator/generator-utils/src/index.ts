import path from 'path';
import {
  fs,
  ora,
  execa,
  getMonorepoPackages,
  canUseNpm,
  canUsePnpm,
  canUseYarn,
  semver,
} from '@modern-js/utils';
import { Solution, SolutionToolsMap } from '@modern-js/generator-common';
import { GeneratorContext } from '@modern-js/codesmith';
import { stripAnsi } from './utils/strip-ansi';
import { i18n, localeKeys } from './locale';
import { getAvailableVersion } from './utils/package';

export * from './utils';

export {
  ora,
  fs,
  semver,
  execa,
  readTsConfigByFile,
  getPackageManager,
  canUseNpm,
  canUsePnpm,
  canUseYarn,
  isReact18,
} from '@modern-js/utils';

export { i18n } from './locale';

export async function getPackageVersion(
  packageName: string,
  registry?: string,
) {
  const spinner = ora('Loading...').start();
  spinner.color = 'yellow';
  if (await canUsePnpm()) {
    const args = ['info', packageName, 'version'];
    if (registry) {
      args.push(`--registry=${registry}`);
    }
    const result = await execa('pnpm', args);
    spinner.stop();
    return stripAnsi(result.stdout);
  }
  if (await canUseYarn()) {
    const args = ['info', packageName, 'version', '--silent'];
    if (registry) {
      args.push(`--registry=${registry}`);
    }
    const result = await execa('yarn', args);
    spinner.stop();
    return stripAnsi(result.stdout);
  }
  if (await canUseNpm()) {
    const args = ['view', packageName, 'version'];
    if (registry) {
      args.push(`--registry=${registry}`);
    }
    const result = await execa('npm', args);
    spinner.stop();
    return stripAnsi(result.stdout);
  }
  spinner.stop();
  throw new Error('not found npm, please install npm before');
}

export async function getModernVersion(solution: Solution, registry?: string) {
  const dep = SolutionToolsMap[solution];
  const modernVersion = await getPackageVersion(dep, registry);
  return modernVersion;
}

export async function getModernPluginVersion(
  solution: Solution,
  packageName: string,
  options: { cwd?: string; registry?: string } = {},
) {
  const { cwd = process.cwd(), registry } = options;
  const getLatetPluginVersion = async () => {
    const version = await getPackageVersion(packageName, registry);
    return version;
  };

  if (
    !packageName.startsWith('@modern-js') ||
    packageName.includes('electron') ||
    packageName.includes('codesmith') ||
    packageName.includes('easy-form') ||
    packageName.startsWith('@modern-js-reduck')
  ) {
    return getLatetPluginVersion();
  }
  // get project solution version
  const pkgPath = path.join(
    require.resolve(SolutionToolsMap[solution], { paths: [cwd] }),
    '../../../../',
    'package.json',
  );
  if (fs.existsSync(pkgPath)) {
    const pkgInfo = fs.readJSONSync(pkgPath);

    const modernVersion = pkgInfo.version;
    if (typeof modernVersion !== 'string') {
      return getLatetPluginVersion();
    }
    if (semver.lt(modernVersion, '1.15.0')) {
      return getLatetPluginVersion();
    }
    return getAvailableVersion(packageName, modernVersion, registry);
  }
  return getLatetPluginVersion();
}

export function getPackageManagerText(packageManager: 'pnpm' | 'yarn' | 'npm') {
  return packageManager === 'yarn' ? 'yarn' : `${packageManager} run`;
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
      error: i18n.t(localeKeys.packagePath.exit, { value }),
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
