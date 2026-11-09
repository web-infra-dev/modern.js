import { RESOURCE_STAGES } from '@modern-js/utils/universal/constants';
import type {
  ChunkId,
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
  publicPath: string;
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
      publicPath:
        typeof WEBPACK_PUBLIC_PATH === 'string' ? WEBPACK_PUBLIC_PATH : '',
      nonce: typeof WEBPACK_NONCE === 'string' ? WEBPACK_NONCE : undefined,
    };
  } catch {
    return undefined;
  }
};

export const DEFAULT_STAGE_ORDER = ['visible', 'interactive', 'idle'];
const ELEMENT_STAGES = ['viewport', 'interaction'];
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_IDLE_QUIET_MS = 2000;
/** Upper bound after `load`, for pages that never stop requesting. */
const IDLE_MAX_WAIT_MS = 10000;

type QueueItem = { chunkId: ChunkId; stage: string };

const now = () =>
  typeof performance !== 'undefined' ? Math.round(performance.now()) : 0;

export class ResourceStageScheduler {
  private config: RuntimeStageConfig = { o: DEFAULT_STAGE_ORDER };

  private hasConfig = false;

  /** Stage -> chunk ids, in declaration order. */
  private lists = new Map<string, ChunkId[]>();

  /** Chunk id -> URLs of its CSS files. */
  private cssFiles = new Map<ChunkId, string[]>();

  private routeLists?: StagePayload['r'];

  private routeListsApplied = false;

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

  constructor(payloads: StagePayload[]) {
    this.bundler = getBundlerRuntime();
    for (const payload of payloads) {
      this.add(payload);
    }
    this.patchChunkLoading();
    this.watchPageStages();
    this.watchPageHide();
  }

  add(payload: StagePayload) {
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
    if (payload.r) {
      this.routeLists = { ...this.routeLists, ...payload.r };
    }
    if (payload.u) {
      this.loadExternalPayload(payload.u);
    }
    this.pump();
  }

  /**
   * Client rendered pages do not know the matched routes until the router runs,
   * so their route lists are picked here. Server rendered pages already got the
   * lists of the matched routes from the server.
   */
  setRoutes(routeIds: string[]) {
    if (this.routeListsApplied || !this.routeLists) {
      return;
    }
    this.routeListsApplied = true;
    for (const routeId of routeIds) {
      const list = this.routeLists[routeId];
      if (list?.s) {
        this.addLists(list.s, list.k);
      }
    }
    this.pump();
  }

  /** A stage arrived. Later stages imply that earlier ones arrived too. */
  mark(stage: string, auto = false) {
    if (auto && this.config.m?.includes(stage)) {
      return;
    }
    if (this.arrived.has(stage)) {
      return;
    }
    const order = this.config.o;
    const index = order.indexOf(stage);
    const time = now();
    for (let i = 0; i <= index; i++) {
      if (!this.arrived.has(order[i])) {
        this.arrived.set(order[i], time);
        this.onArrived(order[i]);
      }
    }
    if (index === -1) {
      this.arrived.set(stage, time);
    }
    this.pump();
  }

  /**
   * Element stages: prefetch the chunks a loader would request, without
   * executing the module. The loader is called while chunk loading is
   * captured, so only the chunk ids are recorded.
   */
  prefetchLoader(loader: () => unknown, stage: string) {
    if (this.shouldSkip(stage)) {
      return;
    }
    const chunkIds = this.captureChunkIds(loader);
    for (const chunkId of chunkIds) {
      if (this.queued.has(chunkId)) {
        continue;
      }
      this.queued.set(chunkId, stage);
      this.urgent.push({ chunkId, stage });
    }
    this.pump();
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
    this.timers.push(setTimeout(() => this.mark(stage), timeout));
  }

  private shouldSkip(stage: string) {
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
      if (!this.arrived.has(stage)) {
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
    if (typeof document === 'undefined') {
      return;
    }
    const limit = this.config.n ?? DEFAULT_CONCURRENCY;
    let total = [...this.inFlight.values()].reduce((a, b) => a + b, 0);
    while (total < limit) {
      const item = this.nextItem();
      if (!item) {
        return;
      }
      if (this.prefetch(item)) {
        total++;
      }
    }
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
    const candidates: [string, string][] = [
      [bundler.publicPath + bundler.filename(chunkId), 'script'],
      ...(this.cssFiles.get(String(chunkId)) ?? []).map(
        url => [url, 'style'] as [string, string],
      ),
    ];
    const urls = candidates.filter(([url]) => !this.isPreloaded(url));
    if (!urls.length) {
      return false;
    }
    record.stage = stage;
    record.prefetchStart = now();
    let remaining = urls.length;
    this.inFlight.set(stage, (this.inFlight.get(stage) ?? 0) + 1);
    const done = () => {
      remaining--;
      if (remaining > 0) {
        return;
      }
      record.prefetchEnd = now();
      this.inFlight.set(stage, (this.inFlight.get(stage) ?? 1) - 1);
      this.pump();
    };
    for (const [url, as] of urls) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = as;
      link.href = url;
      // Same rule as the bundler runtime, so the cached response is reused.
      if (this.config.x && url.indexOf(`${location.origin}/`) !== 0) {
        link.crossOrigin = this.config.x;
      }
      if (bundler.nonce) {
        link.nonce = bundler.nonce;
      }
      (link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority =
        'low';
      link.onload = done;
      link.onerror = done;
      document.head.appendChild(link);
    }
    return true;
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
        if (now() - loadTime >= IDLE_MAX_WAIT_MS) {
          fire();
          return;
        }
        timer = setTimeout(fire, quiet);
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
      { once: true },
    );
  }

  /** A payload too large for the HTML is fetched after first paint. */
  private loadExternalPayload(url: string) {
    const load = () => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      if (this.config.x && url.indexOf(`${location.origin}/`) !== 0) {
        script.crossOrigin = this.config.x;
      }
      if (this.bundler?.nonce) {
        script.nonce = this.bundler.nonce;
      }
      (script as HTMLScriptElement & { fetchPriority?: string }).fetchPriority =
        'low';
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
export const getResourceStageScheduler = ():
  ResourceStageScheduler | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const global = window as unknown as Record<string, GlobalStages | undefined>;
  const current = global[RESOURCE_STAGES];
  if (current && !Array.isArray(current)) {
    return current.scheduler;
  }
  const scheduler = new ResourceStageScheduler(current ?? []);
  global[RESOURCE_STAGES] = {
    push: (payload: StagePayload) => scheduler.add(payload),
    report: () => scheduler.getReport(),
    scheduler,
  };
  return scheduler;
};
