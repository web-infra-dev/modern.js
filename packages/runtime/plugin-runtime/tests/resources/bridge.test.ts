import {
  hasResourceStages,
  markInteractiveStage,
  setResourceStageRoutes,
} from '../../src/core/resources/bridge';

const g = window as unknown as { __MODERN_RS__?: unknown };

describe('resource stages bridge', () => {
  afterEach(() => {
    delete g.__MODERN_RS__;
  });

  it('does nothing on a page without resource stages', () => {
    expect(hasResourceStages()).toBe(false);
    markInteractiveStage();
    setResourceStageRoutes(['home']);
    expect(g.__MODERN_RS__).toBeUndefined();
  });

  it('pushes to the payloads the scheduler reads', () => {
    const payloads: Record<string, unknown>[] = [];
    g.__MODERN_RS__ = payloads;
    expect(hasResourceStages()).toBe(true);
    setResourceStageRoutes(['layout', 'home']);
    markInteractiveStage();
    expect(payloads[0]).toEqual({ q: ['layout', 'home'] });
    expect(payloads[1]).toEqual({ a: ['interactive', expect.any(Number)] });
  });
});
