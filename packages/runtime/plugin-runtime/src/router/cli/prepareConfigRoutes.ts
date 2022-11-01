import { fs } from '@modern-js/utils';
import { bundleRequire } from '@modern-js/node-bundle-require';

export const INNER_CONFIG_ROUTES_FILENAME = 'inner-config-routes.js';

const prepareConfigRoutes = async (
  path: string,
  internalDirectory: string,
  entryName: string,
) => {
  const entryPath = `${internalDirectory}/${entryName}`;

  const mod = await bundleRequire(path);

  const routes = mod.default || mod;

  // create innerDir/routes.js
  fs.outputFileSync(
    `${entryPath}/${INNER_CONFIG_ROUTES_FILENAME}`,
    `export default ${JSON.stringify(routes, null, 2)}`,
  );
};

export default prepareConfigRoutes;
