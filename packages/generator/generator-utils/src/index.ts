import path from 'path';
import type { GeneratorContext } from '@modern-js/codesmith';
import { getNpmVersion, getPackageInfo } from '@modern-js/codesmith';
import { fs } from '@modern-js/codesmith-utils/fs-extra';
import { ora } from '@modern-js/codesmith-utils/ora';
import { Solution, SolutionToolsMap } from '@modern-js/generator-common';
import { i18n, localeKeys } from './locale';
import { fileExist } from './utils/fsExist';
import { getMonorepoPackages } from './utils/monorepo';
import { getAvailableVersion, isPackageExist } from './utils/package';

export * from './utils';

export {
  canUseNpm,
  canUsePnpm,
  canUseYarn,
} from '@modern-js/codesmith-utils/npm';
export { fs } from '@modern-js/codesmith-utils/fs-extra';
export { ora } from '@modern-js/codesmith-utils/ora';
export { semver } from '@modern-js/codesmith-utils/semver';
export { execa } from '@modern-js/codesmith-utils/execa';
export { chalk } from '@modern-js/codesmith-utils/chalk';

export { i18n } from './locale';

export async function getPackageVersion(
  packageName: string,
  registryUrl?: string,
): Promise<string> {
  const spinner = ora({
    text: 'Load Generator...',
    spinner: 'runner',
  }).start();
  const { name, version: pkgVersion } = getPackageInfo(packageName);
  const version = await getNpmVersion(name, {
    version: pkgVersion,
    registryUrl,
  });
  spinner.stop();
  return version;
}

export async function getModernVersion(
  solution: Solution,
  registry?: string,
  distTag = 'latest',
) {
  const dep = SolutionToolsMap[solution];
  const modernVersion = await getPackageVersion(`${dep}@${distTag}`, registry);
  return modernVersion;
}

export async function getModernPluginVersion(
  solution: Solution,
  packageName: string,
  options: { cwd?: string; registry?: string; distTag?: string } = {
    distTag: 'latest',
  },
) {
  const { cwd = process.cwd(), registry, distTag } = options;
  const getLatetPluginVersion = async (tag?: string) => {
    const version = await getPackageVersion(
      `${packageName}@${tag || distTag || 'latest'}`,
      registry,
    );
    return version;
  };

  if (
    !packageName.startsWith('@modern-js') ||
    packageName.includes('electron') ||
    packageName.includes('codesmith') ||
    packageName.includes('easy-form') ||
    packageName.startsWith('@modern-js-reduck') ||
    packageName.includes('eslint-config')
  ) {
    return getLatetPluginVersion('latest');
  }
  // get project solution version
  let pkgPath = path.join(
    require.resolve(SolutionToolsMap[solution], { paths: [cwd] }),
    '../../..',
    'package.json',
  );
  if (solution === Solution.Module) {
    pkgPath = path.join(
      require.resolve(SolutionToolsMap[solution], { paths: [cwd] }),
      '../..',
      'package.json',
    );
  }

  if (fs.existsSync(pkgPath)) {
    const pkgInfo = fs.readJSONSync(pkgPath);

    const modernVersion = pkgInfo.version;
    if (typeof modernVersion !== 'string') {
      return getLatetPluginVersion();
    }
    const version = await getAvailableVersion(
      packageName,
      modernVersion,
      registry,
    );
    if (!(await isPackageExist(`${packageName}@${version}`))) {
      return getLatetPluginVersion();
    }
    return version;
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
  options?: {
    isMwa?: boolean;
  },
) {
  const { isMwa } = options || {};
  const dir = isMwa ? 'apps' : 'packages';
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
  isLocalPackages: boolean,
) {
  if (isLocalPackages && packagePath) {
    return `${packagePath}/`;
  }
  if (isMonorepoSubProject && packagePath) {
    return `packages/${packagePath}/`;
  }

  return '';
}

export function getMWAProjectPath(
  packagePath: string,
  isMonorepoSubProject: boolean,
) {
  if (isMonorepoSubProject && packagePath) {
    return `apps/${packagePath}/`;
  }
  return '';
}

export async function getModernConfigFile(appDir: string) {
  let exist = await fileExist(path.join(appDir, 'modern.config.ts'));
  if (exist) {
    return 'modern.config.ts';
  }
  exist = await fileExist(path.join(appDir, 'modern.config.js'));
  if (exist) {
    return 'modern.config.js';
  }
  return isTsProject(appDir) ? 'modern.config.ts' : 'modern.config.js';
}
