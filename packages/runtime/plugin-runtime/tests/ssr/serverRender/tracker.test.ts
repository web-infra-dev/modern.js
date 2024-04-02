/**
 * @jest-environment node
 */
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
      logger,
      request: new Request('http://127.0.0.1'),
    } as any;
    tracker = createSSRTracker(ssrContext);
  });

  it('track ssr error', () => {
    const error = new Error('mock error');
    tracker.trackError(SSRErrors.PRERENDER, error);

    expect(reporter.errors).toEqual([['SSR Error - App Prerender', error]]);
    expect(logger.errors).toEqual([['App Prerender', error]]);
  });

  it('track ssr timing', () => {
    const cost = 13;
    tracker.trackTiming(SSRTimings.RENDER_HTML, cost);

    expect(serverTiming.serverTimings).toEqual([['ssr-render-html', cost]]);
    expect(logger.timings).toEqual([
      ['SSR Debug - App Render To HTML cost = %d ms, req.url = %s', cost],
    ]);
    expect(reporter.timings).toEqual([['ssr-render-html', cost]]);
  });
});
