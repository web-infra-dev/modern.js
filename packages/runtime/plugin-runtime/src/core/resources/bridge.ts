import { RESOURCE_STAGES } from '@modern-js/utils/universal/constants';
import type { StagePayload } from './types';

/**
 * What the framework runtime tells the resource stage scheduler. It goes
 * through the global the HTML payloads use instead of importing the scheduler,
 * so applications that do not use resource stages do not bundle it. Nothing is
 * done when the page has no payload and no scheduler.
 */
const getGlobal = () =>
  typeof window === 'undefined'
    ? undefined
    : (
        window as unknown as Record<
          string,
          { push: (payload: StagePayload) => void } | undefined
        >
      )[RESOURCE_STAGES];

/** Whether the page has resource stage payloads or a running scheduler. */
export const hasResourceStages = () => Boolean(getGlobal());

/** The first commit or hydration is done; `interactive` unless it is manual. */
export const markInteractiveStage = () => {
  getGlobal()?.push({
    a: [
      'interactive',
      typeof performance !== 'undefined' ? Math.round(performance.now()) : 0,
    ],
  });
};

/** Client rendered pages pass the matched routes after routing. */
export const setResourceStageRoutes = (routeIds: string[]) => {
  getGlobal()?.push({ q: routeIds });
};
