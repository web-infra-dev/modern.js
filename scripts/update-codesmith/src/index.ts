import path from 'path';
import fs from 'fs-extra';
import { getPackages } from '@manypkg/get-packages';
import { getPackageVersion } from '@modern-js/generator-utils';

async function run() {
  const cwd = process.cwd();
  const packages = await getPackages(cwd);
  for (const pkg of packages.packages) {
    const { packageJson, dir } = pkg;
    const { dependencies, devDependencies, peerDependencies } = packageJson;
    packageJson.dependencies = await updateCodesmithVersion(dependencies);
    packageJson.devDependencies = await updateCodesmithVersion(devDependencies);
    packageJson.peerDependencies = await updateCodesmithVersion(
      peerDependencies,
    );
    fs.writeJSONSync(path.join(dir, 'package.json'), packageJson, {
      spaces: 2,
    });
  }
}

const versionMap = new Map();

const updateCodesmithVersion = async (
  dependencies?: Record<string, string>,
) => {
  if (!dependencies) {
    return dependencies;
  }
  for (const dep of Object.keys(dependencies)) {
    if (dep.startsWith('@modern-js') && dep.includes('codesmith')) {
      if (versionMap.get(dep)) {
        dependencies[dep] = versionMap.get(dep);
      } else {
        const version = await getPackageVersion(`${dep}@latest`);
        dependencies[dep] = version;
        versionMap.set(dep, version);
      }
    }
  }
  return dependencies;
};

run().catch(e => {
  console.error(e);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
