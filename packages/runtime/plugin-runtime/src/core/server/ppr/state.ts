import type { PPRArtifact } from '@modern-js/types/server';
import React from 'react';

/**
 * Header sent by the build-time prerender (see `@modern-js/app-tools`) to ask
 * the request handler for a prerender result instead of a page. Its value is
 * the key the result is stored under in `getPrerenderResults()`.
 * It only takes effect on a server created with `staticGenerate: true`.
 */
export const PPR_PRERENDER_HEADER = 'x-modern-ppr-prerender';

/**
 * The build prerenders in the same process as the server. Results are handed
 * over here rather than in the response body, which server middlewares may
 * rewrite; the served prelude goes through those middlewares at request time.
 */
export function getPrerenderResults(): Map<string, unknown> {
  const key = Symbol.for('modern-js.ppr.prerender-results');
  const store = globalThis as typeof globalThis & {
    [key: symbol]: Map<string, unknown> | undefined;
  };
  store[key] ??= new Map();
  return store[key]!;
}

/**
 * Header carrying the variant to prerender, as JSON, e.g. `{"lng":"en"}`.
 */
export const PPR_VARIANT_HEADER = 'x-modern-ppr-variant';

/**
 * The prelude is rendered at build time, so every nonce in it is written as
 * this placeholder and replaced with the request's nonce when served.
 */
export const PPR_NONCE_PLACEHOLDER = '__MODERN_PPR_NONCE__';

export type PPRPhase = 'prerender' | 'resume';

/**
 * Exposed to runtime plugins as `ssrContext.ppr` when the entry uses
 * `server.ssr.mode: 'ppr'`.
 */
export interface PPRContext {
  phase: PPRPhase;
  /**
   * Declares that the prelude depends on a request dimension, such as the
   * language. A prelude is prerendered for each of `values`, and a request is
   * served the prelude whose dimensions match the values it resolved.
   *
   * Returns the value to use: while prerendering, the value being prerendered;
   * otherwise `value` itself.
   */
  vary: (name: string, value: string, values: readonly string[]) => string;
}

export interface PPRState extends PPRContext {
  /** Dimension values of the current render */
  readonly variant: Record<string, string>;
  /** All values of each dimension, reported to the build */
  readonly dimensions: Record<string, string[]>;
  /** Set when the request is served from a prerendered prelude */
  fromPrelude?: boolean;
  /** Loaders deferred by the router plugin until the prelude is sent */
  pendingBeforeRender?: Promise<Response | undefined>;
  /**
   * Renders the router data scripts once loaders have run. The prelude is
   * shared by every request, so this data is written after it instead of
   * inside the React tree.
   */
  renderRouterData?: () => string;
}

export function createPPRState(
  phase: PPRPhase,
  forcedVariant: Record<string, string> = {},
): PPRState {
  const variant: Record<string, string> = {};
  const dimensions: Record<string, string[]> = {};
  return {
    phase,
    variant,
    dimensions,
    vary(name, value, values) {
      const resolved =
        phase === 'prerender' && name in forcedVariant
          ? forcedVariant[name]
          : value;
      variant[name] = resolved;
      dimensions[name] = Array.from(new Set([...values, resolved]));
      return resolved;
    },
  };
}

export function parseVariantHeader(
  value: string | null,
): Record<string, string> {
  if (!value) {
    return {};
  }
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid ${PPR_VARIANT_HEADER} header: ${value}`);
  }
  return Object.fromEntries(
    Object.entries(parsed).map(([key, val]) => [key, String(val)]),
  );
}

/**
 * Trailing slashes do not change which route matches, so `/a/` and `/a`
 * share one artifact.
 */
export function normalizePPRPathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '') || '/';
  }
  return pathname;
}

function isSameVariant(a: Record<string, string>, b: Record<string, string>) {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(key => a[key] === b[key])
  );
}

export function findPPRArtifact(
  artifacts: PPRArtifact[] | undefined,
  pathname: string,
  variant: Record<string, string>,
) {
  if (!artifacts?.length) {
    return undefined;
  }
  const normalized = normalizePPRPathname(pathname);
  return artifacts.find(
    artifact =>
      artifact.pathname === normalized &&
      isSameVariant(artifact.variant, variant),
  );
}

export function replaceNoncePlaceholder(html: string, nonce?: string) {
  return html.split(PPR_NONCE_PLACEHOLDER).join(nonce || '');
}

/**
 * Prerender and resume need React's `react-dom/static` and `resume` APIs,
 * which are stable since React 19.2.
 */
export function isPPRSupported() {
  const [major = 0, minor = 0] = (React.version || '0.0')
    .split('.')
    .map(part => Number.parseInt(part, 10));
  return major > 19 || (major === 19 && minor >= 2);
}

// Never settles: suspending on it while prerendering turns the nearest
// Suspense boundary into a hole that is filled when the request is served.
const postponed = new Promise<never>(() => {});

/**
 * Suspends for the rest of the prerender. React records the nearest Suspense
 * boundary as postponed once the prerender is aborted.
 */
export function postpone(): never {
  throw postponed;
}

/**
 * Fields of `ssrContext.request` that depend on the request itself rather
 * than on the pathname. Reading them while prerendering postpones the
 * component that reads them.
 */
const REQUEST_DYNAMIC_FIELDS = new Set<PropertyKey>([
  'cookie',
  'cookieMap',
  'headers',
  'query',
  'userAgent',
  'referer',
  'host',
  'url',
  'raw',
]);

/**
 * While prerendering, reading request data during render postpones the
 * reading component, the same way reading cookies or headers does in other
 * PPR implementations. Plugins still read the build request in
 * `onBeforeRender`, which runs before this proxy is installed.
 */
export function createPrerenderRequestProxy<T extends object>(request: T): T {
  return new Proxy(request, {
    get(target, property, receiver) {
      if (REQUEST_DYNAMIC_FIELDS.has(property)) {
        postpone();
      }
      return Reflect.get(target, property, receiver);
    },
  });
}
