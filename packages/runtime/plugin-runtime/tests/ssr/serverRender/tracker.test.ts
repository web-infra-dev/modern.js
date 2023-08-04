import {
  SSRErrors,
  SSRTimings,
  SSRTracker,
  createSSRTracker,
} from '../../../src/ssr/serverRender/tracker';
import { SSRServerContext } from '../../../src/ssr/serverRender/types';

const reporter = {
  errors: [] as [string, Error][],
  timings: [] as [string, number][],
  reportError(content: string, e: Error) {
    this.errors.push([content, e]);
  },
  reportTiming(name: string, cost: number) {
    this.timings.push([name, cost]);
  },
};

const serverTiming = {
  serverTimings: [] as [string, number][],
  addServeTiming(name: string, cost: number) {
    this.serverTimings.push([name, cost]);
  },
};

const metrics = {
  errors: new Map<string, number>(),
  timings: [] as [string, number][],
  emitTimer(name: string, cost: number) {
    this.timings.push([name, cost]);
  },
  emitCounter(content: string, counter: number) {
    this.errors.set(content, counter);
  },
};

const logger = {
  errors: [] as [string, Error][],
  timings: [] as [string, number][],
  error(content: string, e: Error) {
    this.errors.push([content, e]);
  },
  debug(name: string, cost: number) {
    this.timings.push([name, cost]);
  },
};

describe('tracker', () => {
  let tracker: SSRTracker;
  beforeAll(() => {
    const ssrContext: SSRServerContext = {
      reporter,
      serverTiming,
      metrics,
      logger,
    } as any;
    tracker = createSSRTracker(ssrContext);
  });

  it('track ssr error', () => {
    const error = new Error('mock error');
    tracker.trackError(SSRErrors.PREFETCH, error);

    expect(reporter.errors).toEqual([
      ['SSR Error - App Prefetch Render', error],
    ]);
    expect(logger.errors).toEqual([['App Prefetch Render', error]]);
    expect(metrics.errors.get('app.prefetch.render.error')).toEqual(1);
  });

  it('track ssr timing', () => {
    const cost = 13;
    tracker.trackTiming(SSRTimings.SSR_RENDER_HTML, cost);

    expect(serverTiming.serverTimings).toEqual([['ssr-render-html', cost]]);
    expect(logger.timings).toEqual([['App Render To HTML cost = %d ms', cost]]);
    expect(metrics.timings).toEqual([['app.render.html.cost', cost]]);
    expect(reporter.timings).toEqual([['ssr-render-html', cost]]);
  });
});
