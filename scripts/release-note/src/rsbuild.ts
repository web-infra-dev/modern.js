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

function getVersionsBetween(oldVersion: string, newVersion: string): string[] {
  const versions: string[] = [];

  try {
    const diffType = semver.diff(oldVersion, newVersion);

    if (!diffType) {
      return [newVersion];
    }

    if (diffType === 'patch' || diffType === 'prepatch') {
      let currentVersion = semver.inc(oldVersion, 'patch');
      while (currentVersion && semver.lte(currentVersion, newVersion)) {
        versions.push(currentVersion);
        const nextVersion = semver.inc(currentVersion, 'patch');
        if (!nextVersion || semver.gt(nextVersion, newVersion)) {
          break;
        }
        currentVersion = nextVersion;
      }
    } else if (diffType === 'minor' || diffType === 'preminor') {
      const oldMajor = semver.major(oldVersion);
      const oldMinor = semver.minor(oldVersion);
      const newMajor = semver.major(newVersion);
      const newMinor = semver.minor(newVersion);

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

      if (oldMajor === newMajor) {
        for (let minor = oldMinor + 1; minor <= newMinor; minor++) {
          const minorVersion = `${oldMajor}.${minor}.0`;
          if (semver.lte(minorVersion, newVersion)) {
            versions.push(minorVersion);
          }
        }
      }
    } else if (diffType === 'major' || diffType === 'premajor') {
      const oldMajor = semver.major(oldVersion);
      const newMajor = semver.major(newVersion);

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

      for (let major = oldMajor + 1; major <= newMajor; major++) {
        if (major === newMajor) {
          versions.push(newVersion);
        } else {
          versions.push(`${major}.0.0`);
        }
      }
    }

    if (versions.length === 0 || versions[versions.length - 1] !== newVersion) {
      versions.push(newVersion);
    }

    return versions;
  } catch {
    return [newVersion];
  }
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
