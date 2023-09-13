function readPackage(pkg, _context) {
  // Fix: https://github.com/browserify/resolve/issues/264
  // `resolve >= 1.21.0` breaks dts-packer, lock the version to 1.20.0.
  if (pkg.name === 'dts-packer') {
    pkg.dependencies.resolve = '1.20.0';
  }

  if (pkg.name === 'hast-util-from-html' && pkg.version.startsWith('1.')) {
    pkg.dependencies = {
      ...pkg.dependencies,
      'vfile-message': '^3.1.2',
    };
  }

  // Some packages still depend on esbuild < 0.17, so we upgrade it manually.
  // ref: https://github.com/lukeed/tsm/issues/48
  if (
    pkg.name === 'tsm' ||
    pkg.name === 'vite' ||
    pkg.name === 'esbuild-loader'
  ) {
    pkg.dependencies.esbuild = '0.17.19';
  }

  const outsideModernPkgList = ['@modern-js/mdx-rs-binding'];

  if (
    (pkg.name.startsWith('@rspress/') || pkg.name.startsWith('rspress')) &&
    pkg.dependencies
  ) {
    pkg.dependencies = Object.fromEntries(
      Object.entries(pkg.dependencies).map(([key, value]) =>
        key.startsWith('@modern-js/') && !outsideModernPkgList.includes(key)
          ? [key, 'workspace:*']
          : [key, value],
      ),
    );
  }

  return pkg;
}

module.exports = { hooks: { readPackage } };
