import { getBundleId } from './bridge';
import { getResourceStageScheduler, isSchedulerRuntime } from './scheduler';
import type { ElementStage, ResourceStage, ResourceStageReport } from './types';

type Loader<T> = () => Promise<T>;

/**
 * The loader returned by a stage. Call it, or pass it to `React.lazy` or
 * loadable, exactly like the `() => import()` it wraps.
 */
export type StagedLoader<T> = Loader<T> & {
  /**
   * Element stages only: the element that starts the prefetch when it enters
   * the viewport (`viewport`) or is hovered, focused or touched
   * (`interaction`). Use it as a React ref, or call it with an element; the
   * returned function releases the element (React 19 calls it on detach).
   */
  trigger: (element: Element | null) => void | (() => void);
};

export type StageDeclaration = {
  /**
   * `key` is added by the build to element stage declarations; do not pass it.
   */
  <T>(loader: Loader<T>, key?: string): StagedLoader<T>;
  /**
   * Tell the framework the stage arrived. For custom stages, and for built-in
   * stages configured with `manual: true`.
   */
  mark: () => void;
  /**
   * Resolves when the stage arrived and the files of it and every earlier
   * stage are downloaded. Use it to run code that should wait for the stage,
   * e.g. warming up modules when the page is idle. Resolves at once on the
   * server.
   */
  ready: () => Promise<void>;
};

export type StagedImport = { readonly [K in ResourceStage]: StageDeclaration };

const ELEMENT_STAGES: ElementStage[] = ['viewport', 'interaction'];

const isBrowser = () =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

const getScheduler = () => getResourceStageScheduler(getBundleId());

/**
 * What the loadable SWC plugin makes of an annotated `() => import()`, so
 * `loadable(stagedImport.<stage>(() => import()))` renders on the server.
 */
type LoadableDescriptor = {
  requireAsync: (props?: unknown) => Promise<unknown>;
  importAsync?: (props?: unknown) => Promise<unknown>;
};

const isLoadableDescriptor = (value: unknown): value is LoadableDescriptor =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as LoadableDescriptor).requireAsync === 'function';

/**
 * The `trigger` of an element stage declaration. One declaration can be bound
 * to many elements (e.g. `ref={loader.trigger}` in a list): the first element
 * that triggers starts the prefetch, and every element is then released.
 * An element is also released by the function `trigger(element)` returns
 * (React 19 calls it when the ref is detached), and, for React 18 which calls
 * `trigger(null)` instead, once it is no longer in the document.
 */
const createTrigger = (stage: ElementStage, start: () => void) => {
  let started = false;
  /** Element -> removes its observer or listeners. */
  const bound = new Map<Element, () => void>();
  const release = (element: Element) => {
    bound.get(element)?.();
    bound.delete(element);
  };
  const releaseAll = () => {
    for (const element of [...bound.keys()]) {
      release(element);
    }
  };
  const releaseDetached = () => {
    for (const element of [...bound.keys()]) {
      if (!element.isConnected) {
        release(element);
      }
    }
  };
  const run = () => {
    if (!started) {
      started = true;
      releaseAll();
      start();
    }
  };
  return (element: Element | null) => {
    if (!element) {
      // The element is removed from the document after its ref is detached.
      if (bound.size) {
        queueMicrotask(releaseDetached);
      }
      return undefined;
    }
    if (started || !isBrowser()) {
      return undefined;
    }
    if (bound.has(element)) {
      return () => release(element);
    }
    if (stage === 'viewport') {
      if (typeof IntersectionObserver === 'undefined') {
        run();
        return undefined;
      }
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          run();
        }
      });
      observer.observe(element);
      bound.set(element, () => observer.disconnect());
      return () => release(element);
    }
    const events = ['pointerenter', 'focusin', 'touchstart'];
    const onEvent = () => run();
    for (const event of events) {
      element.addEventListener(event, onEvent, { passive: true });
    }
    bound.set(element, () => {
      for (const event of events) {
        element.removeEventListener(event, onEvent);
      }
    });
    return () => release(element);
  };
};

const createStage = (stage: string): StageDeclaration => {
  const declare = <T>(loader: Loader<T>, key?: string): StagedLoader<T> => {
    if (isBrowser()) {
      // The lists are in the HTML; a declaration means the page uses them.
      getScheduler();
    }
    // Loadable descriptors stay objects: loadable only renders an object on
    // the server, a function is loaded on the client only.
    const descriptor = isLoadableDescriptor(loader) ? loader : undefined;
    const load = descriptor
      ? () => (descriptor.importAsync ?? descriptor.requireAsync)()
      : loader;
    const staged = (descriptor ?? (() => loader())) as StagedLoader<T>;
    staged.trigger = ELEMENT_STAGES.includes(stage as ElementStage)
      ? createTrigger(stage as ElementStage, () => {
          const scheduler = getScheduler();
          // The chunk ids are of this bundle: the build mapped them to the
          // key, or they are captured with the wrapped chunk loading. In
          // another bundle neither applies.
          if (isSchedulerRuntime()) {
            scheduler?.prefetchElement(key, load, stage);
          }
        })
      : () => undefined;
    return staged;
  };
  return Object.assign(declare, {
    mark: () => {
      getScheduler()?.mark(stage);
    },
    ready: () => getScheduler()?.whenDone(stage) ?? Promise.resolve(),
  });
};

const stages = new Map<string, StageDeclaration>();

/**
 * Names that tooling reads on any object, e.g. `then` when the object is
 * returned from an async function. They are not stages.
 */
const RESERVED = new Set(['then', 'toJSON', '__esModule', '$$typeof']);

/**
 * Declare when the code behind an `import()` is needed, so the framework
 * downloads it ahead of time:
 *
 * ```ts
 * const Editor = lazy(stagedImport.interactive(() => import('./Editor')));
 * ```
 *
 * The build maps each declaration to its files. `critical` files are preloaded
 * from the HTML; other stages are prefetched when the stage arrives. The
 * declaration never changes when the module executes.
 */
export const stagedImport = new Proxy({} as StagedImport, {
  get(_, name) {
    if (typeof name !== 'string' || RESERVED.has(name)) {
      return undefined;
    }
    let stage = stages.get(name);
    if (!stage) {
      stage = createStage(name);
      stages.set(name, stage);
    }
    return stage;
  },
});

/**
 * Loading records of this page: when each stage arrived, and for each chunk
 * when it was prefetched, requested and loaded.
 */
export const getResourceStageReport = (): ResourceStageReport | undefined =>
  getScheduler()?.getReport();

/** Receive the loading records when the page is hidden, e.g. to report them. */
export const onResourceStageReport = (
  callback: (report: ResourceStageReport) => void,
) => {
  getScheduler()?.onReport(callback);
};
