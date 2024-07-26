import { Logger } from '@modern-js/types';
import type { ServerPlugin } from '../types';
import {
  InjectRenderHandlerOptions,
  injectRenderHandlerPlugin,
} from './render/inject';
import {
  initMonitorsPlugin,
  injectloggerPluigin,
  injectServerTiming,
} from './monitors';
import { processedByPlugin } from './processedBy';
import { logPlugin } from './log';
import { faviconPlugin } from './favicon';

export type CreateDefaultPluginsOptions = InjectRenderHandlerOptions & {
  logger?: Logger;
};

export function createDefaultPlugins(
  options: CreateDefaultPluginsOptions = {},
) {
  const plugins: ServerPlugin[] = [
    initMonitorsPlugin(),
    injectRenderHandlerPlugin(options),
    injectloggerPluigin(options.logger),
    injectServerTiming(),
    logPlugin(),
    processedByPlugin(),
    faviconPlugin(),
  ];

  return plugins;
}
