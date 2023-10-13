import { ShouldRevalidateFunction } from '@modern-js/runtime-utils/remix-router';
import { ROUTE_MODULES } from '@modern-js/utils/universal/constants';

export const createShouldRevalidate = (
  routeId: string,
): ShouldRevalidateFunction => {
  return arg => {
    const routeModule = window?.[ROUTE_MODULES as keyof Window]?.[routeId];
    if (routeModule && typeof routeModule.shouldRevalidate === 'function') {
      return routeModule.shouldRevalidate(arg);
    }

    return arg.defaultShouldRevalidate;
  };
};
