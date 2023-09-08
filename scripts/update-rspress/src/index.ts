import path from 'path';
import fs from 'fs-extra';
import { getPackageVersion } from '@modern-js/generator-utils';

const versionMap = new Map();

const updateRspressVersion = async (dependencies?: Record<string, string>) => {
  if (!dependencies) {
    return dependencies;
  }
  for (const dep of Object.keys(dependencies)) {
    // Update rspress version
    if (dep.startsWith('@rspress') || dep.startsWith('rspress')) {
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

async function run() {
  const cwd = process.cwd();
  const repoDir = path.join(cwd, '../../');
  const documentDir = path.join(repoDir, 'packages/document');
  const documentPackages = fs.readdirSync(documentDir);
  await Promise.all(
    documentPackages.map(async pkg => {
      const pkgPath = path.join(documentDir, pkg, 'package.json');
      const pkgObj = fs.readJSONSync(pkgPath);
      pkgObj.devDependencies = await updateRspressVersion(
        pkgObj.devDependencies,
      );
      fs.writeJSONSync(pkgPath, pkgObj, { spaces: 2 });
    }),
  );
}

run().catch(e => {
  console.error(e);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
