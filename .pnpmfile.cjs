function readPackage(pkg, _context) {
  // Fix: https://github.com/browserify/resolve/issues/264
  // `resolve >= 1.21.0` breaks dts-packer, lock the version to 1.20.0.
  if (pkg.name === 'dts-packer') {
    pkg.dependencies.resolve = '1.20.0';
  }

  // bump cssnano version to fix integration test
  // see: https://github.com/modern-js-dev/modern.js/pull/1140
  if (pkg.dependencies['cssnano']) {
    pkg.dependencies['cssnano'] = '^5.1.12';
  }

  // fix react 18 type conflicts
  if (pkg.dependencies['@types/react'] === '*') {
    pkg.dependencies['@types/react'] = '^17';
  }
  if (pkg.dependencies['@types/react-dom'] === '*') {
    pkg.dependencies['@types/react-dom'] = '^17';
  }

  // esbuild >= 0.15.8 generates the logical or assignment operator and breaks in Node 14
  if (pkg.dependencies['esbuild']?.startsWith('0.15')) {
    pkg.dependencies['esbuild'] = '0.15.7';
  }

  return pkg;
}

module.exports = { hooks: { readPackage } };
