import {
  validateViewsConfig,
  type McpViewsConfig,
  type McpViewOptions,
} from '../manifest';
export type { RouteView, McpViewsConfig, McpViewOptions } from '../manifest';
type ViewSource = McpViewsConfig['views'][string];
export interface McpViewsDefinition extends Omit<
  McpViewsConfig,
  'views' | 'viewOptions'
> {
  views: Record<string, ViewSource | ({ source: ViewSource } & McpViewOptions)>;
}
/** Colocate source and presentation, normalized to the existing manifest contract. */
export function defineMcpViews<const T extends McpViewsDefinition>(
  config: T,
): Omit<McpViewsConfig, 'views'> & {
  views: Record<keyof T['views'], ViewSource>;
} {
  const { views, ...metadata } = config;
  const result: McpViewsConfig = { ...metadata, views: {}, viewOptions: {} };
  for (const [name, view] of Object.entries(views)) {
    if (typeof view === 'object' && 'source' in view) {
      const { source, ...options } = view;
      result.views[name] = source;
      result.viewOptions![name] = options;
    } else result.views[name] = view;
  }
  validateViewsConfig(result);
  return result as Omit<McpViewsConfig, 'views'> & {
    views: Record<keyof T['views'], ViewSource>;
  };
}
