import path from 'path';
import { IAppContext } from '@modern-js/core';
import { fs, ROUTE_SPEC_FILE } from '@modern-js/utils';

const generateRoutes = async (appContext: IAppContext) => {
  const { serverRoutes, distDirectory } = appContext;
  const output = JSON.stringify({ routes: serverRoutes }, null, 2);
  await fs.writeFile(path.join(distDirectory, ROUTE_SPEC_FILE), output);
};

export { generateRoutes };
