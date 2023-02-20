import { BuilderTarget, SharedNormalizedConfig } from '../types';

export const isHtmlDisabled = (
  config: SharedNormalizedConfig,
  target: BuilderTarget,
) =>
  (config.tools as { htmlPlugin: boolean }).htmlPlugin === false ||
  target === 'node' ||
  target === 'web-worker' ||
  target === 'service-worker';
