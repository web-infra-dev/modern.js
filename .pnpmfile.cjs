function readPackage(pkg, _context) {

  // workaround for webpack optional peer dependency issue
  if (pkg.dependencies.webpack) {
    pkg.dependencies = {
      ...pkg.dependencies,
      esbuild: '^0.13.13',
    };
  }

  if (pkg.devDependencies.webpack) {
    pkg.dependencies = {
      ...pkg.dependencies,
      esbuild: '^0.13.13',
    };
  }

  // Fix: https://github.com/browserify/resolve/issues/264
  // `resolve >= 1.21.0` breaks dts-packer, lock the version to 1.20.0.
  if (pkg.name === 'dts-packer') {
    pkg.dependencies.resolve = '1.20.0';
  }

  return pkg;
}

module.exports = { hooks: { readPackage } };
