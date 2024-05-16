import path from 'path';
import type { IAppContext } from '@modern-js/core';
import { fs, MAIN_ENTRY_NAME, ROUTE_SPEC_FILE } from '@modern-js/utils';

export const generateRoutes = async (appContext: IAppContext) => {
  const { serverRoutes, distDirectory } = appContext;
  const output = JSON.stringify({ routes: serverRoutes }, null, 2);
  await fs.outputFile(path.join(distDirectory, ROUTE_SPEC_FILE), output);
};

export const getPathWithoutExt = (filename: string) => {
  const extname = path.extname(filename);
  return filename.slice(0, -extname.length);
};

export const isMainEntry = (
  entryName: string,
  mainEntryName?: string,
): boolean => {
  return entryName === (mainEntryName || MAIN_ENTRY_NAME);
};
