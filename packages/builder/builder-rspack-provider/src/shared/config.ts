import type { BuilderTarget } from '@modern-js/builder-shared';
import { NormalizedConfig } from '../types';

// todo: Rspack not support false
export const isUseCssExtract = (
  _config: NormalizedConfig,
  _target: BuilderTarget,
) => true;
// config.tools.cssExtract !== false &&
// !config.tools.styleLoader &&
// target !== 'node' &&
// target !== 'web-worker';
