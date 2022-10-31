import fs from 'fs';
import { bundleRequire } from '@modern-js/node-bundle-require';

const prepareConfigRoutes = async (
  path: string,
  internalDirectory: string,
  entryName: string,
) => {
  const entryPath = `${internalDirectory}/${entryName}`;

  const mod = await bundleRequire(path);

  const routes = mod.default || mod;

  // create innerDir/routes.js
  if (!fs.existsSync(entryPath)) {
    fs.mkdirSync(entryPath);
  }
  fs.writeFileSync(
    `${entryPath}/routes.js`,
    `export default ${JSON.stringify(routes, null, 2)}`,
  );
};

export default prepareConfigRoutes;
