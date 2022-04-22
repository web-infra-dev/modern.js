const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const pkgJsons = glob.sync(
  path.join(__dirname, 'scripts', '**', 'package.json'),
  {
    ignore: ['**/node_modules/**'],
  },
);

pkgJsons.forEach(pkgPath => {
  const content = fs.readFileSync(pkgPath, 'utf-8');
  const pkgJson = JSON.parse(content);
  const { devDependencies } = pkgJson;

  if (devDependencies) {
    Object.keys(devDependencies).forEach(key => {
      if (devDependencies[key].includes('workspace')) {
        devDependencies[key] = 'workspace:*';
      }
    });
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkgJson, null, 2)}\n`);
  }
});
