import type { Logger } from '@modern-js/types';
import type { ServerPlugin } from '../types';
import {
  type InjectRenderHandlerOptions,
  injectRenderHandlerPlugin,
} from './render';
import {
  initMonitorsPlugin,
  injectloggerPluigin,
  injectServerTiming,
} from './monitors';
import { processedByPlugin } from './processedBy';
import { logPlugin } from './log';

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
  ];

  return plugins;
}
