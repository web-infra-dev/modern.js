import { RESOURCE_STAGES } from '@modern-js/utils/universal/constants';
import type { StagePayload } from './types';

/**
 * This application's bundle, set at build time. Payloads the runtime pushes
 * carry it, so on a page that runs several applications the scheduler only
 * takes the stages and routes of its own application.
 */
export const getBundleId = (): string | undefined => {
  try {
    return process.env.MODERN_RESOURCE_STAGES_ID || undefined;
  } catch {
    return undefined;
  }
};

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
    b: getBundleId(),
  });
};

/**
 * The matched routes after routing and after each client side navigation.
 * Client rendered entries pick the stage lists of these routes.
 */
export const setResourceStageRoutes = (routeIds: string[]) => {
  getGlobal()?.push({ q: routeIds, b: getBundleId() });
};
