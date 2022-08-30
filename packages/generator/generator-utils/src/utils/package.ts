import { canUseNpm, execa, logger, semver, stripAnsi } from '@modern-js/utils';

// 判断包是否存在
export async function isPackageExist(packageName: string, registry?: string) {
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

// 判断包是否已经废弃
export async function isPackageDeprecated(
  packageName: string,
  registry?: string,
) {
  if (await canUseNpm()) {
    const args = ['view', packageName, 'deprecated'];
    if (registry) {
      args.push(`--registry=${registry}`);
    }
    const result = await execa('npm', args);
    return stripAnsi(result.stdout);
  }
  throw new Error('not found npm, please install npm before');
}

// 降低包小版本号
export function semverDecrease(version: string) {
  const versionObj = semver.parse(version, { loose: true });

  if (!versionObj) {
    throw new Error(`Version ${version} is not valid semver`);
  }

  versionObj.build = [];
  versionObj.prerelease = [];
  versionObj.patch--;

  const result = versionObj.format();
  if (!semver.valid(result)) {
    logger.debug(`Version ${result} is not valid semver`);
    return version;
  }
  return result;
}

/**
 * 插件存在 hotfix 版本，从 tools 版本号向上找当前插件版本号
 * tools 存在 hotfix 版本，从 tools 版本号向下找当前插件版本号
 * 限制只在当前小版本号范围内寻找
 */
export async function getAvailableVersion(
  packageName: string,
  currentVersion: string,
  registry?: string,
) {
  let times = 5;
  let version = currentVersion;
  while (times) {
    if (
      !(await isPackageExist(`${packageName}@${version}`, registry)) ||
      (await isPackageDeprecated(`${packageName}@${version}`, registry))
    ) {
      version = semver.inc(version, 'patch')!;
      times--;
      continue;
    }
    return version;
  }
  times = 5;
  while (times) {
    version = semverDecrease(version)!;
    if (
      !(await isPackageExist(`${packageName}@${version}`, registry)) ||
      (await isPackageDeprecated(`${packageName}@${version}`, registry))
    ) {
      times--;
      continue;
    }
    return version;
  }
  return currentVersion;
}
