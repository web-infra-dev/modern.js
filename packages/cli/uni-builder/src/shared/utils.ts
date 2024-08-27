import type {
  NormalizedEnvironmentConfig,
  RsbuildContext,
  RsbuildTarget,
  RspackChain,
} from '@rsbuild/core';
import browserslist from 'browserslist';

export const RUNTIME_CHUNK_NAME = 'builder-runtime';

export const SERVICE_WORKER_ENVIRONMENT_NAME = 'serviceWorker';

export const JS_REGEX = /\.(?:js|mjs|cjs|jsx)$/;

export const TS_REGEX = /\.(?:ts|mts|cts|tsx)$/;

export const SCRIPT_REGEX = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;

export const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;

export function isServerEnvironment(
  target: RsbuildTarget,
  environment: string,
) {
  return target === 'node' || environment === SERVICE_WORKER_ENVIRONMENT_NAME;
}

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

export const getUseBuiltIns = (
  config: NormalizedEnvironmentConfig,
): false | 'usage' | 'entry' => {
  const { polyfill } = config.output;
  if (polyfill === 'off') {
    return false;
  }
  return polyfill;
};

export function applyScriptCondition({
  rule,
  chain,
  config,
  context,
  includes,
  excludes,
}: {
  rule: RspackChain.Rule;
  chain: RspackChain;
  config: NormalizedEnvironmentConfig;
  context: RsbuildContext;
  includes: (string | RegExp)[];
  excludes: (string | RegExp)[];
}): void {
  // compile all folders in app directory, exclude node_modules
  // which can be removed next version of rspack
  rule.include.add({
    and: [context.rootPath, { not: NODE_MODULES_REGEX }],
  });

  // Always compile TS and JSX files.
  // Otherwise, it will lead to compilation errors and incorrect output.
  rule.include.add(/\.(?:ts|tsx|jsx|mts|cts)$/);

  // The Rsbuild runtime code is es2017 by default,
  // transform the runtime code if user target < es2017
  const target = castArray(chain.get('target'));
  const legacyTarget = ['es5', 'es6', 'es2015', 'es2016'];
  if (legacyTarget.some(item => target.includes(item))) {
    rule.include.add(/[\\/]@rsbuild[\\/]core[\\/]dist[\\/]/);
  }

  for (const condition of [...includes, ...(config.source.include || [])]) {
    rule.include.add(condition);
  }

  for (const condition of [...excludes, ...(config.source.exclude || [])]) {
    rule.exclude.add(condition);
  }
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

export const getHash = (config: NormalizedEnvironmentConfig) => {
  const { filenameHash } = config.output;

  if (typeof filenameHash === 'string') {
    return filenameHash ? `.[${filenameHash}]` : '';
  }
  return filenameHash ? '.[contenthash:8]' : '';
};

const DEFAULT_WEB_BROWSERSLIST = ['> 0.01%', 'not dead', 'not op_mini all'];

const DEFAULT_BROWSERSLIST: Record<RsbuildTarget, string[]> = {
  web: DEFAULT_WEB_BROWSERSLIST,
  node: ['node >= 14'],
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
