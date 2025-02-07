import type { Logger } from '@modern-js/types';
import type { ServerPlugin } from '../types';
import { logPlugin } from './log';
import {
  initMonitorsPlugin,
  injectServerTiming,
  injectloggerPluigin,
} from './monitors';
import { processedByPlugin } from './processedBy';
import {
  type InjectRenderHandlerOptions,
  injectRenderHandlerPlugin,
} from './render';

export type CreateDefaultPluginsOptions = InjectRenderHandlerOptions & {
  logger?: Logger;
};

export function createDefaultPlugins(
  options: CreateDefaultPluginsOptions = {},
) {
  const plugins: ServerPlugin[] = [
    logPlugin(),
    initMonitorsPlugin(),
    injectRenderHandlerPlugin(options),
    injectloggerPluigin(options.logger),
    injectServerTiming(),
    processedByPlugin(),
  ];

  return plugins;
}
