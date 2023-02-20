import path from 'path';
import { BuilderTarget, SharedNormalizedConfig } from '../types';

export function getTemplatePath(
  entryName: string,
  config: SharedNormalizedConfig,
) {
  const DEFAULT_TEMPLATE = path.resolve(
    __dirname,
    '../../static/template.html',
  );
  const { template = DEFAULT_TEMPLATE, templateByEntries = {} } = config.html;
  return templateByEntries[entryName] || template;
}

export const isHtmlDisabled = (
  config: SharedNormalizedConfig,
  target: BuilderTarget,
) =>
  (config.tools as { htmlPlugin: boolean }).htmlPlugin === false ||
  target === 'node' ||
  target === 'web-worker' ||
  target === 'service-worker';
