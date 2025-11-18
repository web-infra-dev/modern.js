import type { NormalizedEnvironmentConfig, RsbuildTarget } from '@rsbuild/core';
import browserslist from 'browserslist';

export const RUNTIME_CHUNK_NAME = 'builder-runtime';

// RegExp like /builder-runtime([.].+)?\.js$/
export const RUNTIME_CHUNK_REGEX = new RegExp(
  `${RUNTIME_CHUNK_NAME}([.].+)?\\.js$`,
);

export const SERVICE_WORKER_ENVIRONMENT_NAME = 'workerSSR';

export const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;

export const castArray = <T>(arr?: T | T[]): T[] => {
  if (arr === undefined) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
};

// using cache to avoid multiple calls to loadConfig
const browsersListCache = new Map<string, string[]>();

async function getBrowserslist(path: string): Promise<string[] | null> {
  const env = process.env.NODE_ENV;
  const cacheKey = `${path}${env}`;

  if (browsersListCache.has(cacheKey)) {
    return browsersListCache.get(cacheKey)!;
  }

  const result = browserslist.loadConfig({ path, env });

  if (result) {
    browsersListCache.set(cacheKey, result);
    return result;
  }

  return null;
}

export const isHtmlDisabled = (
  config: NormalizedEnvironmentConfig,
  target: RsbuildTarget,
) => {
  const { htmlPlugin } = config.tools as {
    htmlPlugin: boolean | Array<unknown>;
  };
  return (
    htmlPlugin === false ||
    (Array.isArray(htmlPlugin) && htmlPlugin.includes(false)) ||
    target !== 'web'
  );
};

const DEFAULT_WEB_BROWSERSLIST = [
  'chrome >= 87',
  'edge >= 88',
  'firefox >= 78',
  'safari >= 14',
];

const DEFAULT_BROWSERSLIST: Record<RsbuildTarget, string[]> = {
  web: DEFAULT_WEB_BROWSERSLIST,
  node: ['node >= 16'],
  'web-worker': DEFAULT_WEB_BROWSERSLIST,
};

export async function getBrowserslistWithDefault(
  path: string,
  config: { output?: { overrideBrowserslist?: string[] } },
  target: RsbuildTarget,
): Promise<string[]> {
  const { overrideBrowserslist: overrides } = config?.output || {};

  // base overrideBrowserslist config should not works in node
  if (target === 'web' || target === 'web-worker') {
    if (overrides) {
      return overrides;
    }

    const browserslistrc = await getBrowserslist(path);
    if (browserslistrc) {
      return browserslistrc;
    }
  }

  return DEFAULT_BROWSERSLIST[target];
}
