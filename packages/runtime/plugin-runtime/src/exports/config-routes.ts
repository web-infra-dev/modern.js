/**
 * Type definitions for config-based routing
 */

// Import the unified route type
import type { NestedRouteForCli } from '@modern-js/types';
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
 * Helper to create a route configuration
 */
function createRouteConfig(
  component: string,
  path?: string,
  children: RouteConfig[] = [],
  type?: 'page' | 'layout',
  wildcard = false,
): RouteConfig {
  // Validate path parameter
  if (path !== undefined && typeof path !== 'string') {
    throw new Error('Route path must be a string');
  }

  // Validate children parameter
  // Note: children is optional; when provided, it must be an array
  if (children !== undefined && !Array.isArray(children)) {
    throw new Error('Route children must be an array');
  }

  // Handle wildcard routes
  if (wildcard) {
    return {
      path: path || '*',
      component,
      type: 'nested',
      routeType: 'page',
      origin: 'config',
      children: children.length > 0 ? children : undefined,
      _component: component,
    };
  }

  // Must specify a type
  if (!type) {
    throw new Error('createRouteConfig must specify route type');
  }

  return {
    path,
    component,
    type: 'nested',
    routeType: type,
    origin: 'config',
    children: children.length > 0 ? children : undefined,
    _component: component,
  };
}

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
