const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const repository = path.resolve(__dirname, '../../../..');
const modernPackages = {
  '@modern-js/app-tools': 'packages/solutions/app-tools',
  '@modern-js/runtime': 'packages/runtime/plugin-runtime',
  '@modern-js/plugin-module-federation':
    'packages/cli/plugin-module-federation',
  '@modern-js/server-core': 'packages/server/core',
  '@modern-js/prod-server': 'packages/server/prod-server',
  '@modern-js/tsconfig': 'packages/tsconfig',
};
const modernPackage = name => path.join(repository, modernPackages[name]);
const pluginRoot = modernPackage('@modern-js/plugin-module-federation');
const pluginRequire = createRequire(path.join(pluginRoot, 'package.json'));
const providerRequire = createRequire(
  path.join(
    repository,
    'tests/integration/module-federation/provider/package.json',
  ),
);
const testRequire = createRequire(path.join(repository, 'tests/package.json'));

function packageRoot(entry) {
  let directory = path.dirname(entry);
  while (!fs.existsSync(path.join(directory, 'package.json'))) {
    const parent = path.dirname(directory);
    if (parent === directory) throw Error(`No package root for ${entry}`);
    directory = parent;
  }
  return fs.realpathSync(directory);
}

function resolvePackageRoot(name) {
  if (modernPackages[name]) return modernPackage(name);
  return packageRoot(providerRequire.resolve(name));
}

function packageRequire(name) {
  if (modernPackages[name]) return require(modernPackage(name));
  return pluginRequire(name);
}
packageRequire.resolve = name => pluginRequire.resolve(name);
const rspackEntry = pluginRequire.resolve('@rspack/core');
const runtimeToolsRoot = packageRoot(
  createRequire(rspackEntry).resolve('@module-federation/runtime-tools'),
);

function packageAudit() {
  const toolsRequire = createRequire(
    path.join(runtimeToolsRoot, 'package.json'),
  );
  const runtimeEntry = toolsRequire.resolve('@module-federation/runtime');
  const roots = {
    ...Object.fromEntries(
      Object.keys(modernPackages).map(name => [name, modernPackage(name)]),
    ),
    '@rspack/core': packageRoot(rspackEntry),
    '@rspack/binding': packageRoot(
      createRequire(rspackEntry).resolve('@rspack/binding'),
    ),
    '@module-federation/runtime-tools': runtimeToolsRoot,
    '@module-federation/runtime': packageRoot(runtimeEntry),
    '@module-federation/runtime-core': packageRoot(
      createRequire(runtimeEntry).resolve('@module-federation/runtime-core'),
    ),
    '@module-federation/webpack-bundler-runtime': packageRoot(
      toolsRequire.resolve('@module-federation/webpack-bundler-runtime'),
    ),
    '@module-federation/enhanced': resolvePackageRoot(
      '@module-federation/enhanced',
    ),
  };
  return Object.fromEntries(
    Object.entries(roots).map(([name, directory]) => [
      name,
      {
        directory: fs.realpathSync(directory),
        version: JSON.parse(
          fs.readFileSync(path.join(directory, 'package.json')),
        ).version,
      },
    ]),
  );
}

module.exports = {
  repository,
  modernPackage,
  pluginRoot,
  rspackEntry,
  runtimeToolsRoot,
  resolvePackageRoot,
  packageRequire,
  packageAudit,
  testRequire,
};
