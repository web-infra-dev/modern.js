import { logger } from '@modern-js/utils';

/**
 * A request handle compatible with `ServerBase.handle` (Hono's `app.fetch`)
 * and the handler accepted by `createNodeServer`.
 */
export type ReloadableHandle = (
  request: Request,
  ...args: any[]
) => Response | Promise<Response>;

export interface ReloadManagerOptions {
  /**
   * The handle used before the first successful build. Optional: when omitted
   * the manager serves a 503 "starting" response until the first build swaps a
   * real handle in (use `setHandle()` for a fail-fast initial boot).
   */
  initialHandle?: ReloadableHandle;
  /**
   * Build a fresh handle (e.g. a brand new runtime `ServerBase`).
   * If this throws, the previously active handle is retained (rollback).
   */
  build: () => Promise<ReloadableHandle>;
  /** Debounce window (ms) used to coalesce rapid `schedule()` calls. */
  debounceMs?: number;
  /**
   * Called after a handle is successfully built and swapped in (e.g. to clean
   * up the previous runtime). The swap has already been committed when this
   * runs, so throwing here does NOT roll back — it is reported via
   * `onReloadError` instead of `onError`.
   */
  onReload?: (handle: ReloadableHandle) => void;
  /**
   * Called when `build()` throws. The previous handle is kept serving. This is
   * the only path that counts as a failed reload.
   */
  onError?: (error: unknown) => void;
  /**
   * Called when the `onReload` callback throws. The new handle is already
   * active; this is a post-swap cleanup/callback failure, never a rollback.
   */
  onReloadError?: (error: unknown) => void;
}

const DEFAULT_DEBOUNCE_MS = 300;

const notReadyHandle: ReloadableHandle = () =>
  new Response('Dev server is starting…', {
    status: 503,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });

/**
 * Owns the single mutable request handle behind a stable forwarding listener.
 *
 * Guarantees required by the dev-server hot-reload design:
 * - Atomic swap: the active handle is replaced by a single assignment, so
 *   in-flight requests always run against a consistent handle.
 * - Failure isolation: if `build()` rejects, the previous handle stays active
 *   (the dev server never degrades to an empty / broken handle).
 * - Serial execution: reloads never overlap. Requests that arrive while a
 *   reload is running are coalesced into a single trailing reload so that the
 *   final state always reflects the latest source ("last write wins").
 */
export class ReloadManager {
  #current: ReloadableHandle;

  readonly #build: () => Promise<ReloadableHandle>;

  readonly #debounceMs: number;

  readonly #onReload?: (handle: ReloadableHandle) => void;

  readonly #onError?: (error: unknown) => void;

  readonly #onReloadError?: (error: unknown) => void;

  #debounceTimer: ReturnType<typeof setTimeout> | null = null;

  #running = false;

  /** A reload was requested while another was in progress. */
  #pending = false;

  #runningPromise: Promise<void> | null = null;

  #closed = false;

  constructor(options: ReloadManagerOptions) {
    this.#current = options.initialHandle ?? notReadyHandle;
    this.#build = options.build;
    this.#debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    this.#onReload = options.onReload;
    this.#onError = options.onError;
    this.#onReloadError = options.onReloadError;
  }

  /**
   * Replace the active handle directly, bypassing `build()`. Used to seed the
   * initial known-good handle (a fail-fast boot builds the first runtime
   * explicitly so build errors propagate, then seeds it here).
   */
  setHandle(handle: ReloadableHandle): void {
    this.#current = handle;
  }

  /**
   * Stable forwarding handle. Pass this to `createNodeServer` once; it always
   * dispatches to the latest active handle, so the Node server never needs to
   * be recreated on reload.
   */
  get handle(): ReloadableHandle {
    return (request, ...args) => this.#current(request, ...args);
  }

  /** The currently active resolved handle (introspection / tests). */
  get currentHandle(): ReloadableHandle {
    return this.#current;
  }

  /** Whether a reload is currently running (introspection / tests). */
  get isReloading(): boolean {
    return this.#running;
  }

  /**
   * Request a reload, debounced. Multiple calls within the debounce window
   * collapse into a single reload.
   */
  schedule(): void {
    if (this.#closed) {
      return;
    }
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
    }
    this.#debounceTimer = setTimeout(() => {
      this.#debounceTimer = null;
      void this.reloadNow();
    }, this.#debounceMs);
  }

  /**
   * Run a reload immediately. If one is already running, mark a trailing
   * reload and return the in-flight promise (which will include the trailing
   * run) so callers can await final settlement.
   */
  async reloadNow(): Promise<void> {
    if (this.#closed) {
      return;
    }
    if (this.#running) {
      this.#pending = true;
      return this.#runningPromise ?? Promise.resolve();
    }
    this.#running = true;
    this.#runningPromise = this.#runLoop();
    try {
      await this.#runningPromise;
    } finally {
      this.#running = false;
      this.#runningPromise = null;
    }
  }

  async #runLoop(): Promise<void> {
    // Keep rebuilding while new requests arrive so the final handle reflects
    // the most recent source. Only the latest successful build is retained.
    do {
      this.#pending = false;

      let next: ReloadableHandle;
      try {
        next = await this.#build();
      } catch (error) {
        // Build failure is the ONLY failed-reload path: retain the previous
        // handle (rollback) and surface the error. Then re-check pending.
        this.#reportBuildError(error);
        continue;
      }

      // If the manager was closed while this build was in flight, drop the
      // result without committing — no swap, no onReload after close.
      if (this.#closed) {
        return;
      }

      // Build succeeded: commit the swap. From here on there is no rollback —
      // a failure in the onReload callback (e.g. previous-runtime cleanup) is
      // reported separately and never reverts the already-active handle.
      this.#current = next; // atomic swap: a single field assignment
      try {
        this.#onReload?.(next);
      } catch (callbackError) {
        this.#reportReloadCallbackError(callbackError);
      }
    } while (this.#pending && !this.#closed);
  }

  #reportBuildError(error: unknown): void {
    if (this.#onError) {
      this.#onError(error);
    } else {
      logger.error(
        `[dev-server] runtime reload build failed, keep serving previous handle:\n${
          error instanceof Error ? (error.stack ?? error.message) : error
        }`,
      );
    }
  }

  #reportReloadCallbackError(error: unknown): void {
    if (this.#onReloadError) {
      this.#onReloadError(error);
    } else {
      logger.warn(
        `[dev-server] onReload callback failed after a successful swap (handle is already active):\n${
          error instanceof Error ? (error.stack ?? error.message) : error
        }`,
      );
    }
  }

  /**
   * Stop the manager: cancel any pending debounced reload and reject all
   * further `schedule()` / `reloadNow()` calls. Wired into the dev server's
   * close chain so a debounce timer that fires after teardown can never
   * rebuild a runtime once the watcher / builder dev server are gone.
   */
  close(): void {
    this.#closed = true;
    // Drop any trailing reload that was coalesced while a build was running,
    // so #runLoop won't start another build after close.
    this.#pending = false;
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
  }
}

export function createReloadManager(options: ReloadManagerOptions) {
  return new ReloadManager(options);
}
