import { RESOURCE_STAGES } from '@modern-js/utils/universal/constants';
import { getChunkRequestSource } from './requestSource';
import type {
  ChunkId,
  ExternalStagePayload,
  ResourceStageRecord,
  ResourceStageReport,
  RuntimeStageConfig,
  StagePayload,
} from './types';

/**
 * The application's bundler runtime. These names are defines replaced with
 * `__webpack_chunk_load__` and friends when this package is built; the
 * application's Rspack build then resolves those to its own runtime.
 */
declare const WEBPACK_CHUNK_LOAD:
  ((chunkId: ChunkId, ...args: unknown[]) => Promise<unknown>) | undefined;
declare const WEBPACK_SET_CHUNK_LOAD: (
  fn: (chunkId: ChunkId, ...args: unknown[]) => Promise<unknown>,
) => void;
declare const WEBPACK_GET_SCRIPT_FILENAME:
  ((chunkId: ChunkId) => string) | undefined;
declare const WEBPACK_PUBLIC_PATH: string | undefined;
declare const WEBPACK_NONCE: string | undefined;

interface BundlerRuntime {
  /** Load a chunk (`import()` calls it). */
  load: (chunkId: ChunkId, ...args: unknown[]) => Promise<unknown>;
  setLoad: (
    fn: (chunkId: ChunkId, ...args: unknown[]) => Promise<unknown>,
  ) => void;
  /** Chunk id -> JS file name. */
  filename: (chunkId: ChunkId) => string;
  /** Read on each use: applications can change it at runtime (CDN switch). */
  publicPath: () => string;
  nonce?: string;
}

const getBundlerRuntime = (): BundlerRuntime | undefined => {
  try {
    if (
      typeof WEBPACK_CHUNK_LOAD !== 'function' ||
      typeof WEBPACK_GET_SCRIPT_FILENAME !== 'function'
    ) {
      return undefined;
    }
    return {
      load: WEBPACK_CHUNK_LOAD,
      setLoad: WEBPACK_SET_CHUNK_LOAD,
      filename: WEBPACK_GET_SCRIPT_FILENAME,
      publicPath: () => {
        try {
          return typeof WEBPACK_PUBLIC_PATH === 'string'
            ? WEBPACK_PUBLIC_PATH
            : '';
        } catch {
          return '';
        }
      },
      nonce: typeof WEBPACK_NONCE === 'string' ? WEBPACK_NONCE : undefined,
    };
  } catch {
    return undefined;
  }
};

/**
 * Whether the scheduler wraps the chunk loading of the bundle this module is
 * in. A page can run several bundles (micro-frontend sub-applications, Module
 * Federation remotes) while the scheduler belongs to the first one.
 */
export const isSchedulerRuntime = () => {
  try {
    return Boolean(
      typeof WEBPACK_CHUNK_LOAD === 'function' &&
      (WEBPACK_CHUNK_LOAD as { __rs?: true }).__rs,
    );
  } catch {
    return false;
  }
};

export const DEFAULT_STAGE_ORDER = ['visible', 'interactive', 'idle'];
const ELEMENT_STAGES = ['viewport', 'interaction'];
/** Stages that are not page stages in order: always arrived. */
const UNORDERED_STAGES = ['critical', ...ELEMENT_STAGES];
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_IDLE_QUIET_MS = 2000;
/** Upper bound after `load`, for pages that never stop requesting. */
const IDLE_MAX_WAIT_MS = 10000;
/** A prefetch that reports neither load nor error stops holding its slot. */
const PREFETCH_TIMEOUT_MS = 30000;
const EXTERNAL_PAYLOAD_TIMEOUT_MS = 30000;
const DISCARDED_PAYLOAD_ATTRIBUTE = 'data-resource-stages-discarded';

/** Safari does not implement `<link rel="prefetch">` and fires no event for it. */
const supportsPrefetch = () => {
  try {
    const { relList } = document.createElement('link');
    // Old browsers without `supports` do implement prefetch.
    return !relList?.supports || relList.supports('prefetch');
  } catch {
    return true;
  }
};

type QueueItem = { chunkId: ChunkId; stage: string };

const now = () =>
  typeof performance !== 'undefined' ? Math.round(performance.now()) : 0;

const isAbsoluteUrl = (url: string) =>
  /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url) || url.startsWith('/');

/** The browser already fetched the URL, e.g. before the scheduler started. */
const wasFetched = (url: string) => {
  try {
    return (
      performance.getEntriesByName(new URL(url, location.href).href).length > 0
    );
  } catch {
    return false;
  }
};

export class ResourceStageScheduler {
  private config: RuntimeStageConfig = { o: DEFAULT_STAGE_ORDER };

  private hasConfig = false;

  /** Stage -> chunk ids, in declaration order. */
  private lists = new Map<string, ChunkId[]>();

  /** Chunk id -> URLs of its CSS files. */
  private cssFiles = new Map<ChunkId, string[]>();

  /** Element stage declaration key -> chunk ids, from the build. */
  private elements = new Map<string, ChunkId[]>();

  /** Chunk ids without a JS file. */
  private noScript = new Set<string>();

  private canPrefetch = typeof document === 'undefined' || supportsPrefetch();

  private routeLists?: StagePayload['r'];

  /** Routes whose lists were added, so a navigation adds only new ones. */
  private appliedRoutes = new Set<string>();

  private pendingRoutes?: string[];

  /** Bundle that owns this scheduler. */
  readonly bundleId?: string;

  private pendingExternal = new Map<string, number>();

  private initializing = true;

  /** Chunk id -> stage that queued it, so a chunk is fetched once. */
  private queued = new Map<ChunkId, string>();

  private urgent: QueueItem[] = [];

  private inFlight = new Map<string, number>();

  private arrived = new Map<string, number>();

  private records = new Map<ChunkId, ResourceStageRecord>();

  private skipped = new Set<string>();

  private reportCallbacks: ((report: ResourceStageReport) => void)[] = [];

  private bundler?: BundlerRuntime;

  private capturing?: ChunkId[];

  private timers: ReturnType<typeof setTimeout>[] = [];

  private afterVisible: (() => void)[] = [];

  /** Stage -> callbacks waiting for the stage to finish downloading. */
  private waiters = new Map<string, (() => void)[]>();

  constructor(payloads: StagePayload[], bundleId?: string) {
    this.bundler = getBundlerRuntime();
    const config = payloads.find(payload => payload.c)?.c;
    this.bundleId = config?.b ?? bundleId;
    if (config) {
      this.add({ c: config });
    }
    for (const payload of payloads) {
      this.add(payload);
    }
    this.initializing = false;
    this.patchChunkLoading();
    this.watchPageStages();
    this.watchPageHide();
    this.pump();
  }

  add(payload: StagePayload) {
    // Stages and routes pushed by the runtime of another application.
    if (payload.b && this.bundleId && payload.b !== this.bundleId) {
      return;
    }
    if (payload.c?.b && this.bundleId && payload.c.b !== this.bundleId) {
      return;
    }
    if (payload.c && !this.hasConfig) {
      this.hasConfig = true;
      this.config = payload.c;
      for (const [stage, timeout] of Object.entries(payload.c.t ?? {})) {
        this.scheduleTimeout(stage, timeout);
      }
    }
    if (payload.s) {
      this.addLists(payload.s, payload.k);
    }
    for (const [key, element] of Object.entries(payload.e ?? {})) {
      this.elements.set(key, element.s);
      for (const [chunkId, files] of Object.entries(element.k ?? {})) {
        this.cssFiles.set(chunkId, files);
      }
    }
    if (payload.r) {
      this.routeLists = { ...this.routeLists, ...payload.r };
    }
    if (payload.u) {
      if (this.canPrefetch) {
        this.loadExternalPayload(payload.u);
      } else {
        // Nothing of it would be prefetched; do not download it.
        this.skipped.add(this.externalStage(payload.u));
      }
    }
    for (const chunkId of payload.d ?? []) {
      this.noScript.add(String(chunkId));
    }
    if (payload.a) {
      this.mark(payload.a[0], true, payload.a[1]);
    }
    if (payload.q) {
      this.setRoutes(payload.q);
    } else if (payload.r && this.pendingRoutes) {
      this.setRoutes(this.pendingRoutes);
    }
    this.pump();
  }

  /**
   * Client rendered pages do not know the matched routes until the router runs,
   * so their route lists are picked here. Server rendered pages already got the
   * lists of the matched routes from the server.
   */
  setRoutes(routeIds: string[]) {
    if (!this.routeLists) {
      this.pendingRoutes = routeIds;
      return;
    }
    this.pendingRoutes = undefined;
    for (const routeId of routeIds) {
      if (this.appliedRoutes.has(routeId)) {
        continue;
      }
      this.appliedRoutes.add(routeId);
      const list = this.routeLists[routeId];
      if (list?.s) {
        this.addLists(list.s, list.k);
      }
    }
    this.pump();
  }

  /** A stage arrived. Later stages imply that earlier ones arrived too. */
  mark(stage: string, auto = false, time = now()) {
    if (auto && this.config.m?.includes(stage)) {
      return;
    }
    if (this.arrived.has(stage)) {
      return;
    }
    const order = this.config.o;
    const index = order.indexOf(stage);
    for (let i = 0; i <= index; i++) {
      if (!this.arrived.has(order[i])) {
        this.arrived.set(order[i], time);
        this.onArrived(order[i]);
      }
    }
    if (index === -1 && !UNORDERED_STAGES.includes(stage)) {
      this.arrived.set(stage, time);
    }
    this.pump();
  }

  /**
   * Element stages: prefetch the chunks of a declaration when its element
   * triggers. The build maps the declaration key to its chunks and CSS, so
   * nothing runs. Without a key in the mapping (a declaration the build did
   * not process, e.g. in a package outside `include`), the loader is called
   * while chunk loading is captured, so only the chunk ids are recorded; an
   * `import()` that is not split into a chunk runs its module then.
   */
  prefetchElement(
    key: string | undefined,
    loader: () => unknown,
    stage: string,
  ) {
    if (this.shouldSkip(stage)) {
      return;
    }
    const mapped = key === undefined ? undefined : this.elements.get(key);
    const chunkIds = mapped ?? this.captureChunkIds(loader);
    for (const chunkId of chunkIds) {
      if (this.queued.has(chunkId)) {
        continue;
      }
      this.queued.set(chunkId, stage);
      this.urgent.push({ chunkId, stage });
    }
    this.pump();
  }

  /**
   * Resolves when the stage arrived and the prefetches of it and every
   * earlier stage finished, so code run then finds its files in the cache.
   */
  whenDone(stage: string): Promise<void> {
    if (this.isDone(stage)) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.waiters.set(stage, [...(this.waiters.get(stage) ?? []), resolve]);
    });
  }

  private isDone(stage: string) {
    const order = this.config.o;
    const index = order.indexOf(stage);
    if (index === -1) {
      // `critical` is preloaded by the HTML and element stages per element:
      // done once nothing of the stage is downloading. An unknown stage has
      // nothing to wait for.
      return (
        !this.inFlight.get(stage) &&
        !this.urgent.some(item => item.stage === stage)
      );
    }
    if (!this.arrived.has(stage)) {
      return false;
    }
    const stages = order.slice(0, index + 1);
    return stages.every(
      item =>
        !this.lists.get(item)?.length &&
        !this.inFlight.get(item) &&
        !this.pendingExternal.get(item),
    );
  }

  private resolveWaiters() {
    for (const [stage, callbacks] of this.waiters) {
      if (this.isDone(stage)) {
        this.waiters.delete(stage);
        for (const callback of callbacks) {
          callback();
        }
      }
    }
  }

  onReport(callback: (report: ResourceStageReport) => void) {
    this.reportCallbacks.push(callback);
  }

  getReport(): ResourceStageReport {
    return {
      stages: Object.fromEntries(this.arrived),
      records: [...this.records.values()],
      skipped: [...this.skipped],
    };
  }

  private addLists(
    lists: Record<string, ChunkId[]>,
    cssFiles?: Record<string, string[]>,
  ) {
    for (const [chunkId, files] of Object.entries(cssFiles ?? {})) {
      this.cssFiles.set(chunkId, files);
    }
    const rank = (stage: string) => {
      const index = this.config.o.indexOf(stage);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    for (const [stage, chunkIds] of Object.entries(lists)) {
      const list = this.lists.get(stage) ?? [];
      for (const chunkId of chunkIds) {
        const queuedStage = this.queued.get(chunkId);
        if (queuedStage !== undefined) {
          // A route can need a chunk earlier than the entry declared it.
          if (rank(stage) >= rank(queuedStage)) {
            continue;
          }
          this.removeQueued(chunkId);
        }
        this.queued.set(chunkId, stage);
        list.push(chunkId);
      }
      this.lists.set(stage, list);
    }
  }

  private onArrived(stage: string) {
    if (stage === 'visible') {
      this.flushAfterVisible();
    }
    const order = this.config.o;
    const next = order[order.indexOf(stage) + 1];
    if (next && this.config.t?.[next] !== undefined) {
      this.scheduleTimeout(next, this.config.t[next]);
    }
  }

  /**
   * A stage with a timeout is marked when the timeout passes after its
   * previous stage arrived, even if the application never marks it. The first
   * stage in the order counts from navigation start.
   */
  private scheduleTimeout(stage: string, timeout: number) {
    const order = this.config.o;
    const index = order.indexOf(stage);
    const previous = order[index - 1];
    if (index > 0 && previous && !this.arrived.has(previous)) {
      return;
    }
    if (typeof setTimeout === 'undefined') {
      return;
    }
    // The first stage counts from navigation start, also when the scheduler
    // starts late with the first declaration.
    const start = index > 0 && previous ? this.arrived.get(previous)! : 0;
    const delay = Math.max(0, start + timeout - now());
    this.timers.push(setTimeout(() => this.mark(stage), delay));
  }

  private shouldSkip(stage: string) {
    if (!this.canPrefetch) {
      this.skipped.add(stage);
      return true;
    }
    if (stage !== 'idle' && !ELEMENT_STAGES.includes(stage)) {
      return false;
    }
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const skip = Boolean(
      connection &&
      (connection.saveData ||
        connection.effectiveType === '2g' ||
        connection.effectiveType === 'slow-2g'),
    );
    if (skip) {
      this.skipped.add(stage);
    }
    return skip;
  }

  /** The stage whose files are downloaded now: arrived, and earlier ones done. */
  private nextItem(): QueueItem | undefined {
    if (this.urgent.length) {
      return this.urgent.shift();
    }
    for (const stage of this.config.o) {
      const list = this.lists.get(stage);
      const pending = (list?.length ?? 0) + (this.inFlight.get(stage) ?? 0);
      if (!this.arrived.has(stage) || this.pendingExternal.get(stage)) {
        return undefined;
      }
      if (list?.length) {
        if (this.shouldSkip(stage)) {
          list.length = 0;
          continue;
        }
        return { chunkId: list.shift()!, stage };
      }
      if (pending) {
        return undefined;
      }
    }
    return undefined;
  }

  private pump() {
    if (this.initializing || typeof document === 'undefined') {
      return;
    }
    const limit = this.config.n ?? DEFAULT_CONCURRENCY;
    let total = [...this.inFlight.values()].reduce((a, b) => a + b, 0);
    while (total < limit) {
      const item = this.nextItem();
      if (!item) {
        break;
      }
      if (this.prefetch(item)) {
        total++;
      }
    }
    this.resolveWaiters();
  }

  private prefetch({ chunkId, stage }: QueueItem) {
    const bundler = this.bundler;
    if (!bundler) {
      return false;
    }
    const record = this.getRecord(chunkId);
    if (record.requested !== undefined || record.prefetchStart !== undefined) {
      // Already prefetched, or the application loads it at normal priority.
      return false;
    }
    const publicPath = bundler.publicPath();
    const candidates: [string, string][] = [
      ...(this.noScript.has(String(chunkId))
        ? []
        : [
            [publicPath + bundler.filename(chunkId), 'script'] as [
              string,
              string,
            ],
          ]),
      ...(this.cssFiles.get(String(chunkId)) ?? []).map(
        file =>
          [isAbsoluteUrl(file) ? file : publicPath + file, 'style'] as [
            string,
            string,
          ],
      ),
    ];
    const urls = candidates.filter(
      ([url]) => !this.isPreloaded(url) && !wasFetched(url),
    );
    if (!urls.length) {
      return false;
    }
    record.stage = stage;
    record.prefetchStart = now();
    let remaining = urls.length;
    this.inFlight.set(stage, (this.inFlight.get(stage) ?? 0) + 1);
    const finish = () => {
      remaining--;
      if (remaining > 0) {
        return;
      }
      record.prefetchEnd = now();
      record.prefetchStatus = status;
      this.inFlight.set(stage, (this.inFlight.get(stage) ?? 1) - 1);
      this.pump();
    };
    // The worst result of the chunk's files.
    let status: NonNullable<ResourceStageRecord['prefetchStatus']> = 'ok';
    for (const [url, as] of urls) {
      const link = document.createElement('link');
      let settled = false;
      const timer = setTimeout(() => done('timeout'), PREFETCH_TIMEOUT_MS);
      const done = (result: 'ok' | 'error' | 'timeout') => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          if (result !== 'ok' && status !== 'error') {
            status = result;
          }
          finish();
        }
      };
      link.rel = 'prefetch';
      link.as = as;
      link.href = url;
      // Same rule as the bundler runtime, so the cached response is reused.
      if (this.shouldSetCrossOrigin(url)) {
        link.crossOrigin = this.config.x!;
      }
      if (bundler.nonce) {
        link.nonce = bundler.nonce;
      }
      (link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority =
        'low';
      link.onload = () => done('ok');
      link.onerror = () => done('error');
      document.head.appendChild(link);
    }
    return true;
  }

  /**
   * The bundler runtime always sets `use-credentials`, and `anonymous` only
   * for files from another origin; with Subresource Integrity it sets
   * `crossorigin` on every chunk.
   */
  private shouldSetCrossOrigin(url: string) {
    const { x, z } = this.config;
    return Boolean(
      x &&
      (z ||
        x === 'use-credentials' ||
        new URL(url, location.href).origin !== location.origin),
    );
  }

  private getRecord(chunkId: ChunkId) {
    let record = this.records.get(chunkId);
    if (!record) {
      record = { chunkId };
      this.records.set(chunkId, record);
    }
    return record;
  }

  /** A file the HTML already preloads is not prefetched again. */
  private isPreloaded(url: string) {
    const href = new URL(url, location.href).href;
    const links = document.querySelectorAll('link[rel="preload"]');
    for (let i = 0; i < links.length; i++) {
      if ((links[i] as HTMLLinkElement).href === href) {
        return true;
      }
    }
    return false;
  }

  /**
   * Wrap the bundler's chunk loading: a chunk the page needs now leaves the
   * queue (the bundler loads it at normal priority), and the request and load
   * time are recorded for the analysis.
   */
  private patchChunkLoading() {
    const bundler = this.bundler;
    const original = bundler?.load;
    if (!bundler || !original || (original as { __rs?: true }).__rs) {
      return;
    }
    const patched = ((chunkId: ChunkId, ...args: unknown[]) => {
      if (this.capturing) {
        this.capturing.push(chunkId);
        return new Promise(() => undefined);
      }
      const record = this.getRecord(chunkId);
      if (record.requested === undefined) {
        record.requested = now();
        record.source = getChunkRequestSource() ?? 'app';
        this.removeQueued(chunkId);
      }
      const result = original(chunkId, ...args);
      result.then(
        () => {
          record.loaded ??= now();
        },
        () => undefined,
      );
      return result;
    }) as BundlerRuntime['load'] & { __rs?: true };
    patched.__rs = true;
    bundler.setLoad(patched);
  }

  private captureChunkIds(loader: () => unknown) {
    const chunkIds: ChunkId[] = [];
    this.capturing = chunkIds;
    try {
      const result = loader() as Promise<unknown> | undefined;
      // The captured promise never settles; nothing should observe it.
      result?.catch?.(() => undefined);
    } catch {
      // A loader that throws synchronously has nothing to prefetch.
    } finally {
      this.capturing = undefined;
    }
    return chunkIds;
  }

  private removeQueued(chunkId: ChunkId) {
    const stage = this.queued.get(chunkId);
    if (!stage) {
      return;
    }
    const list = this.lists.get(stage);
    const index = list?.indexOf(chunkId) ?? -1;
    if (index >= 0) {
      list!.splice(index, 1);
    }
    this.urgent = this.urgent.filter(item => item.chunkId !== chunkId);
  }

  private watchPageStages() {
    if (typeof window === 'undefined') {
      return;
    }
    this.watchFirstPaint();
    this.watchIdle();
  }

  private watchFirstPaint() {
    const onPaint = () => this.mark('visible', true);
    try {
      const observer = new PerformanceObserver(list => {
        if (
          list
            .getEntries()
            .some(entry => entry.name === 'first-contentful-paint')
        ) {
          observer.disconnect();
          onPaint();
        }
      });
      observer.observe({ type: 'paint', buffered: true });
    } catch {
      // No paint timing: treat the first frame after the DOM is ready as paint.
      const afterFrame = () =>
        requestAnimationFrame(() => setTimeout(onPaint, 0));
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', afterFrame, {
          once: true,
        });
      } else {
        afterFrame();
      }
    }
  }

  /** `idle`: after `load`, once no new resource request starts for a while. */
  private watchIdle() {
    const quiet = this.config.i ?? DEFAULT_IDLE_QUIET_MS;
    const start = () => {
      const loadTime = now();
      let timer: ReturnType<typeof setTimeout> | undefined;
      let observer: PerformanceObserver | undefined;
      const fire = () => {
        observer?.disconnect();
        if (timer) clearTimeout(timer);
        this.mark('idle', true);
      };
      const reset = () => {
        if (timer) clearTimeout(timer);
        const left = loadTime + IDLE_MAX_WAIT_MS - now();
        if (left <= 0) {
          fire();
          return;
        }
        // Never later than the upper bound after `load`.
        timer = setTimeout(fire, Math.min(quiet, left));
      };
      try {
        observer = new PerformanceObserver(list => {
          // Our own prefetches are not activity of the page.
          if (
            list
              .getEntries()
              .some(
                entry =>
                  (entry as PerformanceResourceTiming).initiatorType !== 'link',
              )
          ) {
            reset();
          }
        });
        observer.observe({ type: 'resource' });
      } catch {
        // Without resource timing, wait the quiet window once.
      }
      reset();
    };
    if (document.readyState === 'complete') {
      start();
    } else {
      window.addEventListener('load', start, { once: true });
    }
  }

  private watchPageHide() {
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener(
      'pagehide',
      () => {
        if (!this.reportCallbacks.length) {
          return;
        }
        const report = this.getReport();
        for (const callback of this.reportCallbacks) {
          try {
            callback(report);
          } catch (error) {
            console.error(error);
          }
        }
      },
      // Not once: a page restored from the back/forward cache is hidden again.
    );
  }

  /** Earliest stage an external payload has lists for. */
  private externalStage(payload: ExternalStagePayload) {
    const firstStage =
      typeof payload === 'string' ? this.config.o[0] : payload[1];
    return this.config.o.includes(firstStage) ? firstStage : this.config.o[0];
  }

  /** A payload too large for the HTML is fetched after first paint. */
  private loadExternalPayload(payload: ExternalStagePayload) {
    const url = typeof payload === 'string' ? payload : payload[0];
    const stage = this.externalStage(payload);
    this.pendingExternal.set(stage, (this.pendingExternal.get(stage) ?? 0) + 1);

    const load = () => {
      const script = document.createElement('script');
      // Relative to the public path with `assetPrefix: 'auto'`.
      const src = isAbsoluteUrl(url)
        ? url
        : (this.bundler?.publicPath() ?? '') + url;
      script.src = src;
      script.async = true;
      if (this.shouldSetCrossOrigin(src)) {
        script.crossOrigin = this.config.x!;
      }
      if (this.bundler?.nonce) {
        script.nonce = this.bundler.nonce;
      }
      (script as HTMLScriptElement & { fetchPriority?: string }).fetchPriority =
        'low';
      const finish = () => {
        clearTimeout(timer);
        script.onload = script.onerror = null;
        const remaining = (this.pendingExternal.get(stage) ?? 1) - 1;
        if (remaining) {
          this.pendingExternal.set(stage, remaining);
        } else {
          this.pendingExternal.delete(stage);
        }
        this.pump();
      };
      const timer = setTimeout(() => {
        script.setAttribute(DISCARDED_PAYLOAD_ATTRIBUTE, '');
        script.remove();
        finish();
      }, EXTERNAL_PAYLOAD_TIMEOUT_MS);
      script.onload = finish;
      script.onerror = finish;
      document.head.appendChild(script);
    };
    if (this.arrived.has('visible')) {
      load();
    } else {
      this.afterVisible.push(load);
    }
  }

  /** Run work that waits for first paint. */
  private flushAfterVisible() {
    const callbacks = this.afterVisible;
    this.afterVisible = [];
    for (const callback of callbacks) {
      callback();
    }
  }
}

type GlobalStages = StagePayload[] | ResourceStagesGlobal;

export interface ResourceStagesGlobal {
  push: (payload: StagePayload) => void;
  report: () => ResourceStageReport;
  scheduler: ResourceStageScheduler;
}

/**
 * One scheduler per page, kept on `window` so copies of this package share it.
 * Payloads pushed before the scheduler starts are consumed on start.
 */
export const getResourceStageScheduler = (
  bundleId?: string,
): ResourceStageScheduler | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const global = window as unknown as Record<string, GlobalStages | undefined>;
  const current = global[RESOURCE_STAGES];
  if (current && !Array.isArray(current)) {
    // Another application's scheduler: its lists are not for this bundle.
    const owner = current.scheduler.bundleId;
    return owner && bundleId && owner !== bundleId
      ? undefined
      : current.scheduler;
  }
  // The HTML lists were built for another application on the page; leave the
  // scheduler to that application.
  const owner = current?.find(payload => payload.c?.b)?.c?.b;
  if (owner && bundleId && owner !== bundleId) {
    return undefined;
  }
  const scheduler = new ResourceStageScheduler(current ?? [], bundleId);
  global[RESOURCE_STAGES] = {
    push: (payload: StagePayload) => {
      if (!document.currentScript?.hasAttribute(DISCARDED_PAYLOAD_ATTRIBUTE)) {
        scheduler.add(payload);
      }
    },
    report: () => scheduler.getReport(),
    scheduler,
  };
  return scheduler;
};
