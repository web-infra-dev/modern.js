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

  return pkg;
}

module.exports = { hooks: { readPackage } };
