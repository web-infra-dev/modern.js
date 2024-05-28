import path from 'path';
import { findExists } from '@modern-js/utils';
import { JS_EXTENSIONS } from '../router/cli/constants';
import { APP_FILE_NAME } from './constants';

const hasApp = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext => path.resolve(dir, `${APP_FILE_NAME}${ext}`)),
  );

export const isRuntimeEntry = (dir: string) => hasApp(dir);
