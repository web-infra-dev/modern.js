import path from 'path';
import { fs } from '@modern-js/utils';
import { NESTED_ROUTES_DIR, PAGES_DIR_NAME } from './constants';

export const hasPages = (dir: string) =>
  fs.existsSync(path.join(dir, PAGES_DIR_NAME));

export const hasNestedRoutes = (dir: string) =>
  fs.existsSync(path.join(dir, NESTED_ROUTES_DIR));

export const isRouteEntry = (dir: string) => {
  if (hasNestedRoutes(dir)) {
    return path.join(dir, NESTED_ROUTES_DIR);
  }
  if (hasPages(dir)) {
    return path.join(dir, PAGES_DIR_NAME);
  }
  return false;
};
