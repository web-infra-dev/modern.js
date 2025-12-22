import type {
  AppNormalizedConfig,
  AppToolsNormalizedConfig,
} from '@modern-js/app-tools';
import { isReact18, isUseRsc } from '@modern-js/utils';

export type SSRMode = 'string' | 'stream' | false;

/**
 * Unified SSR mode resolution function.
 * Priority:
 * 1. If SSG is enabled, use SSG configuration (SSG takes precedence over SSR when both are configured)
 * 2. User's explicit server.ssr/server.ssrByEntries config
 * 3. Otherwise return false (no SSR)
 */
export function resolveSSRMode(params: {
  entry?: string;
  config: AppToolsNormalizedConfig;
  appDirectory?: string;
  nestedRoutesEntry?: string;
}): SSRMode {
  const { entry, config, appDirectory, nestedRoutesEntry } = params;

  // 1. Check if SSG is enabled first (SSG takes precedence over SSR when both are configured)
  const isSsgEnabled =
    config.output?.ssg ||
    (config.output?.ssgByEntries &&
      (entry
        ? !!config.output.ssgByEntries[entry]
        : Object.keys(config.output.ssgByEntries).length > 0));

  if (isSsgEnabled) {
    if (nestedRoutesEntry) {
      return 'stream';
    } else {
      return 'string';
    }
  }

  // 2. Check user's explicit SSR config (server.ssr or server.ssrByEntries)
  const ssr = entry
    ? config.server?.ssrByEntries?.[entry] || config.server?.ssr
    : config.server?.ssr;

  if (ssr !== undefined) {
    if (!ssr) {
      return false;
    }
    if (typeof ssr === 'boolean') {
      return ssr ? 'stream' : false;
    }
    return ssr.mode === 'string' ? 'string' : 'stream';
  }

  // 3. No SSR
  return false;
}
