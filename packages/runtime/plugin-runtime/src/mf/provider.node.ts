import { createBridgeComponent } from '@module-federation/bridge-react/server';
import { render, hydrate, renderStream } from './callbacks.node';
import type { ModernBridgeComponentOptions } from './types';

/** The Node export renders the same scoped Root through the Modern request flow. */
export function createModernBridgeComponent<Props = Record<string, unknown>>(
  options: ModernBridgeComponentOptions<Props>,
) {
  return createBridgeComponent<Props>({
    ...options,
    render,
    hydrate,
    renderStream,
  });
}
