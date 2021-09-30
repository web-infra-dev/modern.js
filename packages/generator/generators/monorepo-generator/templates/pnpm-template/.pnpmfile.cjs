function readPackage(pkg, _context) {
  // Override the manifest of foo@1.x after downloading it from the registry
  // fix @samverschueren/stream-to-observable bug
  if (pkg.name === '@samverschueren/stream-to-observable') {
    pkg.dependencies = {
      ...pkg.dependencies,
      'any-observable': '^0.5.1',
    };
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
