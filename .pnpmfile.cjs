function readPackage(pkg, _context) {
  // Override the manifest of foo@1.x after downloading it from the registry
  if (pkg.name === '@samverschueren/stream-to-observable') {
    pkg.dependencies = {
      ...pkg.dependencies,
      'any-observable': '^0.5.1',
    };
  }

  if (pkg.dependencies['webpack']) {
    console.info(pkg.name);
    pkg.dependencies = {
      ...pkg.dependencies,
      'esbuild': '^0.13.14',
    };
  }

  if (pkg.devDependencies['webpack']) {
    // console.info(pkg.name);
    pkg.dependencies = {
      ...pkg.dependencies,
      'esbuild': '^0.13.14',
    };
  }

  return pkg;
}

module.exports = { hooks: { readPackage } };
