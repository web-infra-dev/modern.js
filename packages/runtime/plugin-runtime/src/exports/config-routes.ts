/**
 * Type definitions for config-based routing
 */

// Import shared types from parser
import type {
  DefineRoutesFunction,
  LayoutFunction,
  PageFunction,
  RouteConfig,
  RouteFunction,
  RouteFunctions,
  WildcardFunction,
} from '../router/cli/config-routes/parseRouteConfig';

// Re-export types for backward compatibility
export type {
  RouteConfig,
  RouteFunction,
  LayoutFunction,
  PageFunction,
  WildcardFunction,
  RouteFunctions,
  DefineRoutesFunction,
};

/**
 * defineRoutes - main function to define route configurations
 */
export function defineRoutes(
  routesCallback: (
    routeFunctions: RouteFunctions,
    fileRoutes: RouteConfig[],
  ) => RouteConfig[],
): (
  routeFunctions: RouteFunctions,
  fileRoutes: RouteConfig[],
) => RouteConfig[] {
  return routesCallback;
}
