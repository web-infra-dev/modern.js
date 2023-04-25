const path = require('path');
const { fs } = require('@modern-js/utils');
const { getProjects } = require('@modern-js/monorepo-tools');
const detectIndent = require('detect-indent');

const updatePkgJson = (pkgPath, pkgJson) => {
  const output = fs.readFileSync(pkgPath, 'utf-8');
  const indent = detectIndent(output);
  fs.writeJSONSync(pkgPath, pkgJson, { spaces: indent.amount });
};

(async () => {
  const monoRootDir = path.join(__dirname, '../../');
  console.info(monoRootDir);
  const projects = await getProjects(
    { packagesMatchs: { enableAutoFinder: true } },
    monoRootDir,
  );
  const internalBuildPackageName = '@scripts/build';
  const insertPackageName = '@swc/helpers';
  const insertPkgVersion = '0.5.1';
  const b = [];

  for (const project of projects) {
    if (
      project.extra.devDependencies &&
      project.extra.devDependencies[internalBuildPackageName] &&
      (!project.extra.scripts ||
        (project.extra.scripts &&
          project.extra.scripts.build &&
          project.extra.scripts.build !== 'modern-lib build'))
    ) {
      b.push(project.name);
    }

    if (
      project.extra.scripts &&
      project.extra.scripts.build &&
      project.extra.scripts.build === 'modern-lib build' &&
      Boolean(project.extra.private) !== true
    ) {
      const modernConfigPath = path.join(
        project.extra.path,
        './modern.config.js',
      );

      if (!fs.pathExistsSync(modernConfigPath)) {
        continue;
      }

      const modernConfig = fs.readFileSync(modernConfigPath, 'utf8');
      if (!modernConfig.includes(`require('@scripts/build')`)) {
        continue;
      }

      const realPkgJsonPath = path.join(project.extra.path, './package.json');
      const pkgJson = require(realPkgJsonPath);

      if (
        project.extra.dependencies &&
        !project.extra.dependencies[insertPackageName]
      ) {
        console.info('insert dependencies');
        pkgJson.dependencies[insertPackageName] = insertPkgVersion;
      } else if (!project.extra.dependencies) {
        console.info('create dependencies');
        pkgJson.dependencies = {};
        pkgJson.dependencies[insertPackageName] = insertPkgVersion;
      }

      updatePkgJson(realPkgJsonPath, pkgJson);
    }
  }
  console.info(b);
})();
