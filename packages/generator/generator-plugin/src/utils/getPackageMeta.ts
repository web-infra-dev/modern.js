import { execa } from '@modern-js/generator-utils';
import { timeoutPromise } from '@modern-js/codesmith';

export const NPM_API_TIMEOUT = 30000;

interface Options {
  registryUrl?: string;
}

/**
 * get package meta info
 * @param {string} packageName
 * @param {Options} options
 * @returns {string}
 */

export async function getPackageMeta(
  packageName: string,
  packageVersion: string,
  options?: Options,
): Promise<{ meta: Record<string, unknown> }> {
  const { registryUrl } = options || {};
  const params = ['view', `${packageName}@${packageVersion}`, 'meta', '--json'];

  if (registryUrl) {
    params.push('--registry');
    params.push(registryUrl);
  }

  const getPkgInfoPromise = execa('npm', params);
  const { stdout } = await timeoutPromise(
    getPkgInfoPromise,
    NPM_API_TIMEOUT,
    `Get npm version of '${packageName}'`,
  );

  if (!stdout) {
    return { meta: {} };
  }

  try {
    const pkgMetaInfo = JSON.parse(stdout);
    return { meta: pkgMetaInfo };
  } catch (e) {
    throw new Error(
      `Version \`${packageVersion}\` for package \`${packageName}\` could not be found`,
    );
  }
}
