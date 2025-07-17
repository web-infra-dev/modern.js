import path from 'path';
import { fs, MAIN_ENTRY_NAME, ROUTE_SPEC_FILE } from '@modern-js/utils';
import type { AppToolsContext } from '../types/plugin';

export const generateRoutes = async (appContext: AppToolsContext) => {
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
