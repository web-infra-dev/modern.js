import fs from 'fs';
import path from 'path';
import { execa, semver } from '@modern-js/utils';
import type { CommitObj } from './types';
import {
  APP_TOOLS_PACKAGE_NAME,
  APP_TOOLS_PACKAGE_PATH,
  RSBUILD_PACKAGE_NAME,
  RSBUILD_REPO_NAME,
  RSBUILD_REPO_OWNER,
} from './types';

export function getAppToolsVersion(repoDir: string): string | undefined {
  try {
    const packageJsonPath = path.join(repoDir, APP_TOOLS_PACKAGE_PATH);
    if (!fs.existsSync(packageJsonPath)) {
      return undefined;
    }
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8'),
    ) as { version?: string };
    return packageJson.version;
  } catch {
    return undefined;
  }
}

export function getCurrentRsbuildVersion(repoDir: string): string | undefined {
  try {
    const packageJsonPath = path.join(repoDir, APP_TOOLS_PACKAGE_PATH);
    if (!fs.existsSync(packageJsonPath)) {
      return undefined;
    }
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8'),
    ) as {
      dependencies?: Record<string, string>;
    };
    const rsbuildVersion = packageJson.dependencies?.[RSBUILD_PACKAGE_NAME];
    return rsbuildVersion?.replace(/^[\^~]/, '');
  } catch {
    return undefined;
  }
}

export async function getPublishedRsbuildVersion(
  packageVersion: string,
): Promise<string | undefined> {
  try {
    const { stdout } = await execa('npm', [
      'view',
      `${APP_TOOLS_PACKAGE_NAME}@${packageVersion}`,
      'dependencies.@rsbuild/core',
    ]);
    const version = stdout.trim();
    return version ? version.replace(/^[\^~]/, '') : undefined;
  } catch {
    return undefined;
  }
}

export function isVersionUpgraded(
  oldVersion: string,
  newVersion: string,
): boolean {
  try {
    return semver.gt(newVersion, oldVersion);
  } catch {
    return false;
  }
}

/**
 * Get all versions between oldVersion (exclusive) and newVersion (inclusive).
 * Handles prerelease versions, patch, minor, and major upgrades.
 */
function getVersionsBetween(oldVersion: string, newVersion: string): string[] {
  const versions: string[] = [];

  try {
    const oldPrerelease = semver.prerelease(oldVersion);
    const newPrerelease = semver.prerelease(newVersion);

    // Case 1: Both versions are prerelease with same base version and identifier
    // Example: 2.0.0-alpha.0 -> 2.0.0-alpha.3
    if (newPrerelease !== null && oldPrerelease !== null) {
      if (isSameBaseVersion(oldVersion, newVersion)) {
        const oldIdentifier = oldPrerelease[0] as string;
        const newIdentifier = newPrerelease[0] as string;

        if (oldIdentifier === newIdentifier) {
          return getPrereleaseVersionsBetween(
            oldVersion,
            newVersion,
            oldIdentifier,
          );
        }
      }
      return [newVersion];
    }

    // Case 2: Old version is prerelease, new version is stable with same base
    // Example: 2.0.0-alpha.0 -> 2.0.0
    if (oldPrerelease !== null && newPrerelease === null) {
      if (isSameBaseVersion(oldVersion, newVersion)) {
        const oldIdentifier = oldPrerelease[0] as string;
        const prereleaseVersions = getPrereleaseVersionsBetween(
          oldVersion,
          newVersion,
          oldIdentifier,
          false,
        );
        prereleaseVersions.push(newVersion);
        return prereleaseVersions;
      }
    }

    // Case 3: New version is prerelease (from stable to prerelease)
    // Example: 1.7.2 -> 2.0.0-alpha.0
    if (newPrerelease !== null) {
      return [newVersion];
    }

    // Case 4: Stable version upgrades (patch, minor, major)
    const diffType = semver.diff(oldVersion, newVersion);
    if (!diffType || diffType === 'prerelease') {
      return [newVersion];
    }

    if (diffType === 'patch' || diffType === 'prepatch') {
      return getPatchVersionsBetween(oldVersion, newVersion);
    }

    if (diffType === 'minor' || diffType === 'preminor') {
      return getMinorVersionsBetween(oldVersion, newVersion);
    }

    if (diffType === 'major' || diffType === 'premajor') {
      return getMajorVersionsBetween(oldVersion, newVersion);
    }

    return [newVersion];
  } catch {
    return [newVersion];
  }
}

/**
 * Check if two versions have the same base version (major.minor.patch)
 */
function isSameBaseVersion(version1: string, version2: string): boolean {
  return (
    semver.major(version1) === semver.major(version2) &&
    semver.minor(version1) === semver.minor(version2) &&
    semver.patch(version1) === semver.patch(version2)
  );
}

/**
 * Get all prerelease versions between two versions with the same identifier.
 * @param includeNewVersion - Whether to include newVersion in the result
 */
function getPrereleaseVersionsBetween(
  oldVersion: string,
  newVersion: string,
  identifier: string,
  includeNewVersion = true,
): string[] {
  const versions: string[] = [];
  let currentVersion = semver.inc(oldVersion, 'prerelease', identifier);

  const compareFn = includeNewVersion
    ? (v: string | null) => v && semver.lte(v, newVersion)
    : (v: string | null) => v && semver.lt(v, newVersion);

  while (currentVersion && compareFn(currentVersion)) {
    versions.push(currentVersion);
    if (currentVersion === newVersion) {
      break;
    }
    const nextVersion = semver.inc(currentVersion, 'prerelease', identifier);
    if (!nextVersion || !compareFn(nextVersion)) {
      break;
    }
    currentVersion = nextVersion;
  }

  if (includeNewVersion && versions[versions.length - 1] !== newVersion) {
    versions.push(newVersion);
  }

  return versions;
}

/**
 * Get all patch versions between two versions.
 */
function getPatchVersionsBetween(
  oldVersion: string,
  newVersion: string,
): string[] {
  const versions: string[] = [];
  let currentVersion = semver.inc(oldVersion, 'patch');

  while (currentVersion && semver.lte(currentVersion, newVersion)) {
    versions.push(currentVersion);
    const nextVersion = semver.inc(currentVersion, 'patch');
    if (!nextVersion || semver.gt(nextVersion, newVersion)) {
      break;
    }
    currentVersion = nextVersion;
  }

  if (versions.length === 0 || versions[versions.length - 1] !== newVersion) {
    versions.push(newVersion);
  }

  return versions;
}

/**
 * Get all versions between two minor versions.
 * Includes remaining patch versions in old minor and all minor versions up to target.
 */
function getMinorVersionsBetween(
  oldVersion: string,
  newVersion: string,
): string[] {
  const versions: string[] = [];
  const oldMajor = semver.major(oldVersion);
  const oldMinor = semver.minor(oldVersion);
  const newMajor = semver.major(newVersion);
  const newMinor = semver.minor(newVersion);

  // List remaining patch versions in the old minor version
  let currentVersion = semver.inc(oldVersion, 'patch');
  while (
    currentVersion &&
    semver.major(currentVersion) === oldMajor &&
    semver.minor(currentVersion) === oldMinor &&
    semver.lt(currentVersion, newVersion)
  ) {
    versions.push(currentVersion);
    const nextVersion = semver.inc(currentVersion, 'patch');
    if (
      !nextVersion ||
      semver.major(nextVersion) !== oldMajor ||
      semver.minor(nextVersion) !== oldMinor
    ) {
      break;
    }
    currentVersion = nextVersion;
  }

  // List all minor versions up to the target
  if (oldMajor === newMajor) {
    for (let minor = oldMinor + 1; minor <= newMinor; minor++) {
      const minorVersion = `${oldMajor}.${minor}.0`;
      if (semver.lte(minorVersion, newVersion)) {
        versions.push(minorVersion);
      }
    }
  }

  if (versions.length === 0 || versions[versions.length - 1] !== newVersion) {
    versions.push(newVersion);
  }

  return versions;
}

/**
 * Get all versions between two major versions.
 * Includes remaining versions in old major and all major versions up to target.
 */
function getMajorVersionsBetween(
  oldVersion: string,
  newVersion: string,
): string[] {
  const versions: string[] = [];
  const oldMajor = semver.major(oldVersion);
  const newMajor = semver.major(newVersion);

  // List remaining versions in the old major version
  let currentVersion = semver.inc(oldVersion, 'patch');
  while (
    currentVersion &&
    semver.major(currentVersion) === oldMajor &&
    semver.lt(currentVersion, newVersion)
  ) {
    versions.push(currentVersion);
    const nextVersion = semver.inc(currentVersion, 'patch');
    if (!nextVersion || semver.major(nextVersion) !== oldMajor) {
      break;
    }
    currentVersion = nextVersion;
  }

  // List all major versions up to the target
  for (let major = oldMajor + 1; major <= newMajor; major++) {
    if (major === newMajor) {
      versions.push(newVersion);
    } else {
      versions.push(`${major}.0.0`);
    }
  }

  if (versions.length === 0 || versions[versions.length - 1] !== newVersion) {
    versions.push(newVersion);
  }

  return versions;
}

export function formatRsbuildUpgradeNote(
  oldVersion: string,
  newVersion: string,
  lang: 'en' | 'zh' = 'en',
): CommitObj {
  const versions = getVersionsBetween(oldVersion, newVersion);
  const releaseLinks = versions.map(version => {
    const releaseUrl = `https://github.com/${RSBUILD_REPO_OWNER}/${RSBUILD_REPO_NAME}/releases/tag/v${version}`;
    return `[v${version}](${releaseUrl})`;
  });

  let linksText: string;
  if (releaseLinks.length === 1) {
    linksText = releaseLinks[0];
  } else {
    const lastLink = releaseLinks[releaseLinks.length - 1];
    const otherLinks = releaseLinks.slice(0, -1);
    if (lang === 'en') {
      linksText = `${otherLinks.join(', ')}, and ${lastLink}`;
    } else {
      linksText = `${otherLinks.join('、')}和${lastLink}`;
    }
  }

  if (lang === 'en') {
    return {
      id: '',
      type: 'dependencies',
      message: `Upgrade ${RSBUILD_PACKAGE_NAME}`,
      summary: `Upgrade ${RSBUILD_PACKAGE_NAME} from v${oldVersion} to v${newVersion}. See ${linksText} for details.`,
      summary_zh: `升级 ${RSBUILD_PACKAGE_NAME} 从 v${oldVersion} 到 v${newVersion}，查看 ${linksText} 了解详情。`,
    };
  }
  return {
    id: '',
    type: 'dependencies',
    message: `升级 ${RSBUILD_PACKAGE_NAME}`,
    summary: `Upgrade ${RSBUILD_PACKAGE_NAME} from v${oldVersion} to v${newVersion}. See ${linksText} for details.`,
    summary_zh: `升级 ${RSBUILD_PACKAGE_NAME} 从 v${oldVersion} 到 v${newVersion}，查看 ${linksText} 了解详情。`,
  };
}
