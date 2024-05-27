import path from 'path';
import { fs } from '@modern-js/utils';
import { NESTED_ROUTES_DIR } from './constants';

export const hasNestedRoutes = (dir: string) =>
  fs.existsSync(path.join(dir, NESTED_ROUTES_DIR));
