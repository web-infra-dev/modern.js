interface RuntimeOptionsBase {
  config: Record<string, any>;
  serverConfig?: Record<string, any>;
  plugins?: any[];
}

/**
 * Produce a fully-isolated options object for a single runtime build.
 *
 * `buildRuntimeServer` runs for the initial boot AND for every hot reload, so
 * each build must own every container that a plugin or the apply pipeline
 * could append to / rewrite. A shallow `{ ...base }` is NOT enough: `config`,
 * `serverConfig` and `plugins` would still share references, letting one
 * runtime's appended middlewares / plugins leak into the next reload.
 *
 * This clones:
 * - a fresh top-level options object
 * - a fresh `config` with a fresh `config.output` (so writing `assetPrefix`
 *   never mutates the caller's original `options.config`)
 * - a fresh `serverConfig` whose `middlewares` / `renderMiddlewares` /
 *   `plugins` are new arrays
 * - a fresh top-level `plugins` array
 *
 * Nested config sub-objects that are only read (never appended to) stay shared
 * by reference, which is intentional and cheap.
 */
export function createRuntimeServerOptions<T extends RuntimeOptionsBase>(
  base: T,
  assetPrefix?: string,
): T {
  const baseConfig = base.config ?? {};
  const baseOutput =
    (baseConfig as { output?: Record<string, any> }).output ?? {};
  const baseServerConfig = base.serverConfig ?? {};

  return {
    ...base,
    config: {
      ...baseConfig,
      output: {
        ...baseOutput,
        ...(assetPrefix ? { assetPrefix } : {}),
      },
    },
    serverConfig: {
      ...baseServerConfig,
      middlewares: [...(baseServerConfig.middlewares ?? [])],
      renderMiddlewares: [...(baseServerConfig.renderMiddlewares ?? [])],
      ...(baseServerConfig.plugins
        ? { plugins: [...baseServerConfig.plugins] }
        : {}),
    },
    plugins: [...(base.plugins ?? [])],
  } as T;
}
