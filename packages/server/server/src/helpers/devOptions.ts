import { merge } from '@modern-js/utils/lodash';
import type { ModernDevServerOptions } from '../types';
import { getDefaultDevOptions } from './constants';

export const getDevOptions = (options: ModernDevServerOptions) => {
  const devOptions = options.dev;
  const defaultOptions = getDefaultDevOptions();
  return merge(defaultOptions, devOptions);
};
