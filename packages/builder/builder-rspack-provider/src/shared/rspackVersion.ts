import path from 'path';

export const getRspackVersion = async (): Promise<string> => {
  try {
    const core = require.resolve('@rspack/core');
    const pkg = await import(path.join(core, '../../package.json'));

    return pkg?.version;
  } catch (err) {
    // don't block build process
    console.error(err);
    return '';
  }
};

// apply builtin:swc-loader
export const supportedRspackMinimumVersion = '0.3.6';

export const isSatisfyRspackMinimumVersion = async (customVersion?: string) => {
  let version = customVersion || (await getRspackVersion());
  const { semver } = await import('@modern-js/utils');

  // The nightly version of rspack is to append `-canary-xxx` to the current version
  if (version.includes('-canary')) {
    version = version.split('-canary')[0];
  }

  return version ? semver.lte(supportedRspackMinimumVersion, version) : true;
};
