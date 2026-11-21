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
   * (`interaction`). Use it as a React ref, or call it with an element.
   */
  trigger: (element: Element | null) => void;
};

export type StageDeclaration = {
  <T>(loader: Loader<T>): StagedLoader<T>;
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

const createTrigger = (stage: ElementStage, start: () => void) => {
  let started = false;
  const run = () => {
    if (!started) {
      started = true;
      start();
    }
  };
  return (element: Element | null) => {
    if (!element || started || !isBrowser()) {
      return;
    }
    if (stage === 'viewport') {
      if (typeof IntersectionObserver === 'undefined') {
        run();
        return;
      }
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          run();
        }
      });
      observer.observe(element);
      return;
    }
    const events = ['pointerenter', 'focusin', 'touchstart'];
    const onEvent = () => {
      for (const event of events) {
        element.removeEventListener(event, onEvent);
      }
      run();
    };
    for (const event of events) {
      element.addEventListener(event, onEvent, { passive: true });
    }
  };
};

const createStage = (stage: string): StageDeclaration => {
  const declare = <T>(loader: Loader<T>): StagedLoader<T> => {
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
          // Capturing the chunk ids needs the wrapped chunk loading. In
          // another bundle the loader would run the real import instead.
          if (isSchedulerRuntime()) {
            scheduler?.prefetchLoader(load, stage);
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
