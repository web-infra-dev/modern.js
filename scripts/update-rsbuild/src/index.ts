import path from 'path';
import fs from 'fs-extra';
import { getPackages } from '@manypkg/get-packages';
import { getPackageVersion } from '@modern-js/generator-utils';

const versionMap = new Map();

const updateRsbuildVersion = async (dependencies?: Record<string, string>) => {
  if (!dependencies) {
    return dependencies;
  }
  for (const dep of Object.keys(dependencies)) {
    const rsbuildVersion = process.env.RSBUILD_VERSION || 'latest';
    if (dep.startsWith('@rsbuild')) {
      if (versionMap.get(dep)) {
        dependencies[dep] = versionMap.get(dep);
      } else {
        const version = await getPackageVersion(`${dep}@${rsbuildVersion}`);
        dependencies[dep] = version;
        versionMap.set(dep, version);
      }
    }
  }
  return dependencies;
};

async function run() {
  const cwd = process.cwd();
  const packages = await getPackages(cwd);
  for (const pkg of packages.packages) {
    const { packageJson, dir } = pkg;
    const { dependencies, devDependencies, peerDependencies } = packageJson;
    packageJson.dependencies = await updateRsbuildVersion(dependencies);
    packageJson.devDependencies = await updateRsbuildVersion(devDependencies);
    packageJson.peerDependencies = await updateRsbuildVersion(peerDependencies);
    fs.writeJSONSync(path.join(dir, 'package.json'), packageJson, {
      spaces: 2,
    });
  }
}

run().catch(e => {
  console.error(e);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
