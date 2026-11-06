import { randomUUID } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import path from 'path';
import { createProdServer, loadServerPlugins } from '@modern-js/prod-server';
import type { ServerRoute } from '@modern-js/types';
import type { PPRArtifact, PPRManifest } from '@modern-js/types/server';
import { SERVER_DIR, getMeta, logger } from '@modern-js/utils';

/** Kept in sync with `@modern-js/runtime` (`core/server/ppr/state.ts`) */
const PPR_PRERENDER_HEADER = 'x-modern-ppr-prerender';
const PPR_VARIANT_HEADER = 'x-modern-ppr-variant';

/**
 * The server stores each prerender result here under the key sent in the
 * request, see `getPrerenderResults` in `@modern-js/runtime`.
 */
function takePrerenderResult(key: string) {
  const store = globalThis as typeof globalThis & {
    [key: symbol]: Map<string, unknown> | undefined;
  };
  const results = store[Symbol.for('modern-js.ppr.prerender-results')];
  const result = results?.get(key) as PrerenderResult | undefined;
  results?.delete(key);
  return result;
}

const MAX_CONCURRENT_REQUESTS = 10;

interface PrerenderResult {
  head: string;
  prelude: string;
  postponed: string | null;
  variant: Record<string, string>;
  dimensions: Record<string, string[]>;
}

type RequestHandler = (request: Request, options?: any) => Promise<Response>;

async function prerender(
  requestHandler: RequestHandler,
  urlPath: string,
  variant?: Record<string, string>,
): Promise<PrerenderResult | string> {
  const key = randomUUID();
  const headers: Record<string, string> = {
    host: 'localhost',
    [PPR_PRERENDER_HEADER]: key,
  };
  if (variant) {
    headers[PPR_VARIANT_HEADER] = JSON.stringify(variant);
  }
  const url = `http://localhost${urlPath}`;
  // The node request is only read by servers handling node-style middlewares.
  const req = new IncomingMessage(new Socket());
  req.method = 'GET';
  req.url = urlPath;
  req.headers = headers;
  const response = await requestHandler(
    new Request(url, { method: 'GET', headers }),
    { node: { req, res: new ServerResponse(req) } },
  );
  await response.body?.cancel();
  const result = takePrerenderResult(key);
  if (result) {
    return result;
  }
  if (!response.ok) {
    return `received HTTP ${response.status}`;
  }
  // The runtime renders a normal page when partial prerendering is not
  // available, e.g. with React below 19.2.
  return 'the server rendered a page instead of a prerender result, partial prerendering needs React 19.2 or later';
}

/** Every combination of the values of each dimension */
function combineVariants(
  dimensions: Record<string, string[]>,
): Record<string, string>[] {
  return Object.entries(dimensions).reduce<Record<string, string>[]>(
    (variants, [name, values]) =>
      variants.flatMap(variant =>
        values.map(value => ({ ...variant, [name]: value })),
      ),
    [{}],
  );
}

function variantKey(variant: Record<string, string>) {
  return JSON.stringify(
    Object.keys(variant)
      .sort()
      .map(key => [key, variant[key]]),
  );
}

async function inBatches<T, R>(items: T[], run: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += MAX_CONCURRENT_REQUESTS) {
    results.push(
      ...(await Promise.all(
        items.slice(i, i + MAX_CONCURRENT_REQUESTS).map(run),
      )),
    );
  }
  return results;
}

async function prerenderPath(
  requestHandler: RequestHandler,
  urlPath: string,
): Promise<PPRArtifact[]> {
  const first = await prerender(requestHandler, urlPath);
  if (typeof first === 'string') {
    logger.warn(`[PPR] Skip prerendering ${urlPath}: ${first}.`);
    return [];
  }

  const toArtifact = (result: PrerenderResult): PPRArtifact => ({
    pathname: urlPath,
    variant: result.variant,
    head: result.head,
    prelude: result.prelude,
    postponed: result.postponed,
  });

  const artifacts = [toArtifact(first)];
  const rendered = new Set([variantKey(first.variant)]);
  const variants = combineVariants(first.dimensions).filter(
    variant => !rendered.has(variantKey(variant)),
  );

  for (const variant of variants) {
    const result = await prerender(requestHandler, urlPath, variant);
    if (typeof result === 'string') {
      logger.warn(
        `[PPR] Skip prerendering ${urlPath} for ${JSON.stringify(variant)}: ${result}.`,
      );
      continue;
    }
    const key = variantKey(result.variant);
    // A plugin may resolve the requested variant to another one.
    if (!rendered.has(key)) {
      rendered.add(key);
      artifacts.push(toArtifact(result));
    }
  }
  return artifacts;
}

/** Everything the prerender needs, serializable to hand to a child process */
export interface PrerenderInput {
  appDirectory: string;
  distDirectory: string;
  metaName: string;
  serverPlugins: { name: string; options?: Record<string, any> }[];
  /** The normalized config without functions, see `serializeConfig` */
  config: Record<string, any>;
  routes: ServerRoute[];
  entries: { entryName: string; urlPaths: string[] }[];
}

async function createRequestHandler(
  input: PrerenderInput,
): Promise<RequestHandler> {
  const { appDirectory, distDirectory, metaName, config, routes } = input;
  const nodeServer = await createProdServer({
    pwd: distDirectory,
    config: config as any,
    appContext: { appDirectory, distDirectory, metaName } as any,
    serverConfigPath: path.resolve(
      distDirectory,
      SERVER_DIR,
      `${getMeta(metaName)}.server`,
    ),
    routes,
    plugins: await loadServerPlugins(
      input.serverPlugins,
      appDirectory || distDirectory,
    ),
    staticGenerate: true,
  });
  return nodeServer.getRequestHandler() as RequestHandler;
}

export async function runPrerender(
  input: PrerenderInput,
): Promise<PPRManifest> {
  const requestHandler = await createRequestHandler(input);
  const manifest: PPRManifest = { version: 1, entries: {} };
  for (const { entryName, urlPaths } of input.entries) {
    const artifacts = (
      await inBatches(urlPaths, urlPath =>
        prerenderPath(requestHandler, urlPath),
      )
    ).flat();
    if (artifacts.length > 0) {
      manifest.entries[entryName] = artifacts;
    }
    logger.info(
      `[PPR] Prerendered ${artifacts.length} prelude(s) for entry "${entryName}".`,
    );
  }
  return manifest;
}

const REGEXP_KEY = '__modernPPRRegExp';

/**
 * JSON keeps the config the server reads at runtime (`server`, `html`,
 * `security`, ...). Functions are dropped; regular expressions, such as
 * `output.inlineScripts`, are kept.
 */
function toJSONValue(value: unknown, ancestors: object[]): unknown {
  if (value instanceof RegExp) {
    return { [REGEXP_KEY]: [value.source, value.flags] };
  }
  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  // Plugin instances may reference their ancestors.
  if (ancestors.includes(value)) {
    return undefined;
  }
  const next = [...ancestors, value];
  if (Array.isArray(value)) {
    return value.map(item => toJSONValue(item, next) ?? null);
  }
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const converted = toJSONValue(item, next);
    if (converted !== undefined) {
      result[key] = converted;
    }
  }
  return result;
}

export function serializeConfig(config: unknown): string {
  return JSON.stringify(toJSONValue(config, []));
}

export function deserializeConfig(text: string): Record<string, any> {
  return JSON.parse(text, (_key, value) =>
    value && typeof value === 'object' && REGEXP_KEY in value
      ? new RegExp(value[REGEXP_KEY][0], value[REGEXP_KEY][1])
      : value,
  );
}
