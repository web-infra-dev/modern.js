import { getResourceStageScheduler } from './scheduler';
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
};

export type StagedImport = { readonly [K in ResourceStage]: StageDeclaration };

const ELEMENT_STAGES: ElementStage[] = ['viewport', 'interaction'];

const isBrowser = () =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

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
    const staged = (() => loader()) as StagedLoader<T>;
    staged.trigger = ELEMENT_STAGES.includes(stage as ElementStage)
      ? createTrigger(stage as ElementStage, () =>
          getResourceStageScheduler()?.prefetchLoader(loader, stage),
        )
      : () => undefined;
    return staged;
  };
  return Object.assign(declare, {
    mark: () => {
      getResourceStageScheduler()?.mark(stage);
    },
  });
};

const stages = new Map<string, StageDeclaration>();

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
    if (typeof name !== 'string') {
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
  getResourceStageScheduler()?.getReport();

/** Receive the loading records when the page is hidden, e.g. to report them. */
export const onResourceStageReport = (
  callback: (report: ResourceStageReport) => void,
) => {
  getResourceStageScheduler()?.onReport(callback);
};

/** @internal Start the scheduler as early as the runtime starts. */
export const startResourceStages = () => {
  if (isBrowser()) {
    getResourceStageScheduler();
  }
};

/** @internal Client rendered pages pass the matched routes after routing. */
export const setResourceStageRoutes = (routeIds: string[]) => {
  if (isBrowser()) {
    getResourceStageScheduler()?.setRoutes(routeIds);
  }
};

/** @internal The framework marks `interactive` unless the application does. */
export const markInteractiveStage = () => {
  if (isBrowser()) {
    getResourceStageScheduler()?.mark('interactive', true);
  }
};
