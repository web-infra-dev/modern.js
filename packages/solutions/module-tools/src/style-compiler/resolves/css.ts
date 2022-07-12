import { fs } from '@modern-js/utils';
import { ResolveItemParams } from '../types';
import { postcssResolve } from './postcss';

export const cssResolve = async (params: ResolveItemParams) => {
  const { file } = params;
  const originalCss = fs.readFileSync(file, 'utf-8');
  return postcssResolve(originalCss, params);
};
